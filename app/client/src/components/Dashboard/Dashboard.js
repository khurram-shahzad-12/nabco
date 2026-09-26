import React from "react";
import {useAuth} from '../../contexts/AuthContext'

const Dashboard = () => {
    const {isAuthenticated, user} = useAuth();

    return isAuthenticated ?
        <div>Welcome <b>{user.user_name}</b>, please use the menu to navigate the site.</div>
        :
        <div>Please open the menu and log in</div>
};

export default Dashboard;