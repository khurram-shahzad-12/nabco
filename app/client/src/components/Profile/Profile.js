import React, {useEffect, useState} from "react";
import {useAuth0} from "@auth0/auth0-react";
import Cookies from 'universal-cookie';

const Profile = props => {
    const {user, isAuthenticated, isLoading, getAccessTokenSilently} = useAuth0();
    const [accessToken, setAccessToken] = useState(null);
    const cookies = new Cookies();

    useEffect(() => {
        cookies.set("apiToken", accessToken, { path: '/' });
        accessToken !== null && props.tokenCallback(accessToken);
    }, [accessToken]);

    const imgStyles = {
        display: "block",
        marginLeft: "auto",
        marginRight: "auto"
    };

    const getAccessToken = async () => {
        const token = await getAccessTokenSilently({
            audience: `${process.env.REACT_APP_URL_ROOT}/api/`,
            scope: "read:current_user",
            "grant_type":"client_credentials"
        });
        setAccessToken(token);
    };

    if (isLoading) {
        return <div>Loading ...</div>;
    } else {
        getAccessToken();
    }

    return (
        isAuthenticated && (
            <div>
                {/* <img src={user.picture} alt={user.name} style={imgStyles}/> */}
                <h3>{user.name}</h3>
            </div>
        )
    );
};

export default Profile;