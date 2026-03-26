import React, {useEffect, useState} from "react";
import {useAuth0} from "@auth0/auth0-react";
import Cookies from 'universal-cookie';
import { Box, Typography, Avatar } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";


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
            <Box sx={{display:'flex', alignItems: 'center', gap:1, ml: 2, my:2}}>
                {/* <img src={user.picture} alt={user.name} style={imgStyles}/> */}
                <Avatar><PersonIcon/></Avatar>
                <Typography variant='h6' sx={{fontWeight: 500}}>{user.name}</Typography>
            </Box>
        )
    );
};

export default Profile;