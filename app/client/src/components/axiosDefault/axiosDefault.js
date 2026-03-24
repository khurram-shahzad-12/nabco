import axios from "axios";
import Cookies from 'universal-cookie';

const axiosDefault = props => {
	const cookies = new Cookies();
	const token = cookies.get("apiToken");
	let instance;
	if(token) {
		instance = axios.create({
			headers: {
				Authorization: `Bearer ${token}`
			}
		});
	} else {
		instance = axios.create();
	}

	return instance;
};

export default axiosDefault;

// https://stackoverflow.com/questions/64680277/how-to-use-axios-instance-in-different-components-in-react
