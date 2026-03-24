import React from "react";
import {useAuth0} from "@auth0/auth0-react";

const Dashboard = () => {
    const {isAuthenticated, user} = useAuth0();

    return isAuthenticated ?
        <div>Welcome <b>{user.name}</b>, please use the menu to navigate the site.</div>
        :
        <div>Please open the menu and log in</div>
};

export default Dashboard;