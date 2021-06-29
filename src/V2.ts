import axios, { AxiosInstance } from 'axios';

export default class V2 {
	private clientID: number;
	private clientSecret: string;
	private accessToken = '';
	private api: AxiosInstance;
	private oauth: AxiosInstance;
	private baseUrl = 'https://osu.ppy.sh/api/v2';

	constructor(clientID: number, clientSecret: string) {
		this.clientID = clientID;
		this.clientSecret = clientSecret;

		// Create API AxiosInstance
		this.api = axios.create({
			baseURL: this.baseUrl,
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			timeout: 7e3
		});

		// Create OAuth AxiosInstance
		this.oauth = axios.create({
			baseURL: 'https://osu.ppy.sh/oauth',
			timeout: 7e3
		});
	}

	/**
	 * Logs you into the osu! API.
	 */
	async login(): Promise<boolean> {
		const { data: { access_token }} = await this.oauth.post('token', {
			grant_type: 'client_credentials',
			client_id: this.clientID,
			client_secret: this.clientSecret,
			scope: 'public',
			code: 'code'
		});

		this.accessToken = access_token;

		this.api = axios.create({
			baseURL: this.baseUrl,
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			timeout: 7e3
		});

		return true;
	}
}
