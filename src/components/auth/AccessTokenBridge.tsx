import {ReactNode} from "react";
import {useAuth0} from "@auth0/auth0-react";
import {setAccessTokenProvider} from "../../utils/http/accessToken.ts";

export const AccessTokenBridge = ({children}: { children: ReactNode }) => {
    const {getAccessTokenSilently} = useAuth0()
    setAccessTokenProvider(() => getAccessTokenSilently())
    return <>{children}</>
}
