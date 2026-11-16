type AccessTokenProvider = () => Promise<string>

let provider: AccessTokenProvider | undefined

export const setAccessTokenProvider = (next: AccessTokenProvider | undefined) => {
    provider = next
}

export const getAccessToken = async (): Promise<string | undefined> => provider?.()
