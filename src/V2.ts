import axios, { AxiosInstance } from 'axios';
import * as osuwu from './Types';
import Constants from './Constants';

export default class V2 {
	private clientID: number;
	private clientSecret: string;
	accessToken = '';
	private api: AxiosInstance;
	private oauth: AxiosInstance;
	private baseUrl = 'https://osu.ppy.sh/api/v2';
	constants = Constants;

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

	async beatmap(id: osuwu.ID): Promise<osuwu.V2.Beatmap> {
		const { data } = await this.api.get(`/beatmaps/${id}`);
		const { beatmapset, failtimes } = data;
		const { availability, hype, nominations } = beatmapset;
		const { count_circles, count_sliders, count_spinners } = data;
		const totalObjects = count_circles + count_sliders + count_spinners;

		return {
			beatmapID: data['id'],
			difficultyName: data['version'],
			difficultyRating: data['difficulty_rating'],
			totalLength: data['total_length'],
			status: data['status'],
			mode: data['mode'],
			difficultyStats: {
				ar: data['ar'],
				cs: data['cs'],
				hp: data['drain'],
				od: data['accuracy']
			},
			beatmapset: {
				artist: beatmapset['artist'],
				artistUnicode: beatmapset['artist_unicode'],
				covers: beatmapset['covers'],
				favouriteCount: beatmapset['favourite_count'],
				beatmapsetID: beatmapset['id'],
				nsfw: beatmapset['nsfw'],
				playCount: beatmapset['play_count'],
				previewURL: beatmapset['preview_url'],
				source: beatmapset['source'],
				status: beatmapset['status'],
				title: beatmapset['title'],
				titleUnicode: beatmapset['title_unicode'],
				userID: beatmapset['user_id'],
				video: beatmapset['video'],
				availability: {
					downloadDisabled: availability ? availability['download_disabled'] : null,
					moreInformation: availability ? availability['more_information'] : null
				},
				bpm: beatmapset['bpm'],
				canBeHyped: beatmapset['can_be_hyped'],
				mapper: beatmapset['creator'],
				discussion: {
					enabled: beatmapset['discussion_enabled'],
					locked: beatmapset['discussion_locked']
				},
				hype: {
					current: hype ? hype['current'] : null,
					required: hype ? hype['required'] : null
				},
				isScoreable: beatmapset['is_scoreable'],
				lastUpdated: new Date(beatmapset['last_updated']),
				legacyThreadURL: beatmapset['legacy_thread_url'],
				nominations: {
					current: nominations ? nominations['current'] : null,
					required: nominations ? nominations['required'] : null
				},
				ranked: beatmapset['ranked'],
				rankedDate: new Date(beatmapset['ranked_date']),
				storyboard: beatmapset['storyboard'],
				submittedDate: new Date(beatmapset['submitted_date']),
				tags: beatmapset['tags'].split(' '),
			},
			failtimes: {
				exit: failtimes['exit'],
				fail: failtimes['fail']
			},
			maxCombo: data['max_combo'],
			beatmapsetID: data['beatmapset_id'],
			bpm: data['bpm'],
			convert: data['convert'],
			objects: {
				total: totalObjects,
				circles: count_circles,
				sliders: count_sliders,
				spinners: count_spinners	
			},
			deletedAt: new Date(data['deleted_at']),
			hitLength: data['hit_length'],
			isScoreable: data['is_scoreable'],
			lastUpdated: new Date(data['last_updated']),
			passCount: data['passcount'],
			playCount: data['playcount'],
			ranked: data['ranked'],
			url: data['url']
		};
	}
}
