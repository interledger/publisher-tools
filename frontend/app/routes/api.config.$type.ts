import { data } from 'react-router'
import { getDefaultData } from '@shared/default-data'
import { AWS_PREFIX } from '@shared/defines'
import {
  type Configuration,
  type ConfigVersions,
  type Tool,
  TOOLS,
} from '@shared/types'
import { getWalletAddress, normalizeWalletAddress } from '@shared/utils'
import { APP_BASEPATH } from '~/lib/constants.js'
import type { ElementErrors } from '~/lib/types.js'
import { ConfigStorageService } from '~/utils/config-storage.server.js'
import { createInteractiveGrant } from '~/utils/open-payments.server.js'
import {
  convertToConfiguration,
  convertToProfiles,
} from '~/utils/profile-converter'
import { sanitizeConfigFields } from '~/utils/sanitize.server.js'
import { commitSession, getSession } from '~/utils/session.server.js'
import { filterDeepProperties } from '~/utils/utils.server.js'
import { validateForm } from '~/utils/validate.server.js'
import type { Route } from './+types/api.config.$type'

function isToolType(type: string): type is Tool {
  return TOOLS.includes(type as Tool)
}

/** @legacy - no longer used */
export async function loader({ request, params, context }: Route.LoaderArgs) {
  try {
    const { env } = context.cloudflare
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get('walletAddress') || ''

    const elementType = params.type
    const errors: ElementErrors = {
      fieldErrors: {},
      message: [],
    }

    const { result, payload } = await validateForm(
      { walletAddress, intent: 'import' },
      elementType,
    )
    if (!result.success || !payload) {
      errors.fieldErrors = result.error?.flatten().fieldErrors || {
        walletAddress: undefined,
      }
      return data({ errors, success: false }, { status: 400 })
    }

    const ownerWalletAddress = normalizeWalletAddress(
      await getWalletAddress(payload.walletAddress as string),
    )
    try {
      const storageService = new ConfigStorageService({ ...env, AWS_PREFIX })
      const fileContentString =
        await storageService.getJson<ConfigVersions>(ownerWalletAddress)

      let fileContent = Object.assign({}, fileContentString)
      fileContent = filterDeepProperties(fileContent) as ConfigVersions

      return data(fileContent)
    } catch (error) {
      // @ts-expect-error TODO
      if (error.name === 'NoSuchKey' || error.message.includes('404')) {
        // no user config exists for this wallet address - return empty response
        return data({})
      }
      throw error
    }
  } catch (error) {
    return data(
      {
        error: `An error occurred while fetching data: ${(error as Error).message}`,
      },
      { status: 500 },
    )
  }
}
/** TODO: to be removed after the completion of versioned config migration */
export async function action({ request, params, context }: Route.ActionArgs) {
  const { env } = context.cloudflare
  const elementType = params.type

  if (!isToolType(elementType)) {
    return data({ error: `Invalid tool type: ${elementType}` }, { status: 400 })
  }

  const formData = await request.formData()
  const entries = Object.fromEntries(formData.entries())
  if (!entries.walletAddress) {
    return data(
      {
        errors: {
          fieldErrors: { walletAddress: 'Wallet address is required' },
        },
      },
      { status: 400 },
    )
  }
  const intent = entries.intent
  const errors: ElementErrors = {
    fieldErrors: {},
    message: [],
  }

  const { result, payload } = await validateForm(entries, elementType)
  if (!result.success || !payload) {
    const message = result.error?.message
    errors.fieldErrors = result.error?.flatten().fieldErrors || {
      walletAddress: undefined,
    }
    return data({ message, errors, success: false, intent }, { status: 400 })
  }

  let ownerWalletAddress: string = payload.walletAddress
  const walletAddress = await getWalletAddress(ownerWalletAddress)

  const session = await getSession(request.headers.get('Cookie'))
  const validForWallet = session.get('validForWallet')
  session.set('wallet-address', walletAddress)
  if (!validForWallet || validForWallet !== walletAddress.id) {
    try {
      const location = new URL(request.url)
      const baseUrl = location.origin + APP_BASEPATH
      const redirectUrl = `${baseUrl}/api/grant/${elementType}/`
      const grant = await createInteractiveGrant(env, {
        walletAddress,
        redirectUrl,
      })
      session.set('payment-grant', grant)

      return data(
        {
          errors,
          grantRequired: grant.interact.redirect,
          intent,
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': await commitSession(session),
          },
        },
      )
    } catch (error) {
      console.error(error)
      errors.fieldErrors = {
        walletAddress: ['Could not verify ownership of wallet address'],
      }
      return data({ errors }, { status: 500 })
    }
  }

  ownerWalletAddress = normalizeWalletAddress(walletAddress)
  const storageService = new ConfigStorageService({ ...env, AWS_PREFIX })
  switch (request.method) {
    case 'POST':
      return handleCreate(storageService, formData, ownerWalletAddress)

    case 'PUT':
      return handleUpdate(
        storageService,
        formData,
        ownerWalletAddress,
        elementType,
      )

    case 'DELETE':
      return handleDelete(storageService, formData, ownerWalletAddress)

    default:
      return data({ error: 'Method not allowed' }, { status: 405 })
  }
}

async function handleCreate(
  storageService: ConfigStorageService,
  formData: FormData,
  walletAddress: string,
) {
  try {
    const version = formData.get('version') as string

    if (!version) {
      return data(
        { errors: { fieldErrors: { version: 'Version required' } } },
        { status: 400 },
      )
    }

    const defaultDataContent = getDefaultData()
    defaultDataContent.walletAddress = walletAddress
    sanitizeConfigFields({ ...defaultDataContent, version })

    // Get existing configs or handle new wallet
    let configs: ConfigVersions = {}
    try {
      configs = await storageService.getJson(walletAddress)
    } catch (error) {
      const err = error as Error
      if (err.name !== 'NoSuchKey') {
        // for NoSuchKey, continue with defaults
        return data(
          {
            error: `An error occurred while fetching data: ${(error as Error).message}`,
          },
          { status: 500 },
        )
      }
    }

    if (configs.default) {
      if (configs[version]) {
        return data(
          { errors: { fieldErrors: { version: 'Version already exists' } } },
          { status: 409 },
        )
      }
      configs = Object.assign(filterDeepProperties(configs), {
        [version]: defaultDataContent,
      })
    } else {
      configs = Object.assign(
        { default: configs },
        { [version]: defaultDataContent },
      )
    }

    await storageService.putJson(walletAddress, configs)
    return data(configs)
  } catch (error) {
    return data({ error: (error as Error).message }, { status: 500 })
  }
}

async function handleUpdate(
  configStorage: ConfigStorageService,
  formData: FormData,
  walletAddress: string,
  tool: Tool,
) {
  try {
    const fullConfigStr = formData.get('fullconfig') as string

    if (!fullConfigStr) {
      throw new Error('Configuration data is required')
    }

    const newConfigData: ConfigVersions = JSON.parse(fullConfigStr)

    const sanitizedConfig: ConfigVersions = {}
    Object.keys(newConfigData).forEach((key) => {
      if (typeof newConfigData[key] === 'object') {
        sanitizedConfig[key] = sanitizeConfigFields(newConfigData[key])
      }
    })

    let config: Configuration | null = null
    const now = new Date().toISOString()
    try {
      config = await configStorage.getJson<Configuration>(walletAddress)
    } catch (e) {
      const err = e as Error
      if (err.name !== 'NoSuchKey' && !err.message.includes('404')) {
        throw e
      }

      try {
        const legacy =
          await configStorage.getLegacyJson<ConfigVersions>(walletAddress)
        config = convertToConfiguration(legacy, tool, walletAddress)
      } catch (e) {
        const err = e as Error
        if (err.name !== 'NoSuchKey' && !err.message.includes('404')) {
          throw e
        }

        config = {
          $walletAddress: walletAddress,
          $walletAddressId: walletAddress,
          $createdAt: now,
          $modifiedAt: now,
        }
      }
    }

    const profiles = convertToProfiles(sanitizedConfig, tool)
    await configStorage.putJson(walletAddress, {
      ...config,
      $modifiedAt: now,
      [tool]: profiles,
    })

    // we don't do anything with this return data, it's oke
    return data(config)
  } catch (error) {
    return data({ error: (error as Error).message }, { status: 500 })
  }
}

async function handleDelete(
  configStorage: ConfigStorageService,
  formData: FormData,
  walletAddress: string,
) {
  try {
    const version = formData.get('version') as string

    if (!version) {
      return data(
        { errors: { fieldErrors: { version: 'Version required' } } },
        { status: 400 },
      )
    }

    if (version === 'default') {
      throw new Error('Cannot delete default version')
    }

    const existingConfig =
      await configStorage.getJson<ConfigVersions>(walletAddress)

    if (existingConfig[version]) {
      delete existingConfig[version]
      await configStorage.putJson(walletAddress, existingConfig)
    }

    return data(existingConfig)
  } catch (error) {
    return data(
      {
        error: `Error occurred while deleting version: ${(error as Error).message}`,
      },
      { status: 500 },
    )
  }
}
