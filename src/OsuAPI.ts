import axios from 'axios';
import Constants from './Constants';

interface BeatmapOptions {
	since?: Date;
	beatmapsetID?: string;
	beatmapID?: string;
	user?: string;
	userType?: 'id' | 'username',
	mode?: keyof (typeof Constants.Beatmaps.modes),
	converted?: boolean;
	hash?: string;
	limit?: number;
}

export class OsuAPI {
	private apiKey: string;
	public baseUrl = 'https://osu.ppy.sh/api';
	public constants = Constants;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	/**
	 * Makes a request to an endpoint on the osu! API
	 * @param endpoint The endpoint to call
	 * @param parameters An object of parameters to append to the request - key is the name
	 * @async
	 * @private
	 */
	private async makeRequest(endpoint: string, parameters?: object): Promise<object | object[]> {
		let url = `${this.baseUrl}/${endpoint}?k=${this.apiKey}`;

		if (parameters) {
			const keys = Object.keys(parameters);

			Object.values(parameters).forEach((value, i) => {
				if (value) {
					url += `&${keys[i]}=${value}`;
				}
			});
		}

		console.log(url);

		return (await (axios.get(url))).data;
	}

	/**
	 * Retrieve general beatmap information
	 * @param options Configuration of the parameters available for the endpoint
	 * @async
	 */
	public async getBeatmaps(options?: BeatmapOptions) {
		// Make the request
		const beatmaps = await this.makeRequest('get_beatmaps', {
			since: options.since,
			s: options.beatmapsetID,
			b: options.beatmapID,
			u: options.user,
			type: options.userType,
			m: options.mode,
			a: options.converted,
			h: options.hash,
			limit: options.limit
		}) as object[];

		// Parse the beatmaps
		const parsedBeatmaps = beatmaps.map(beatmap => {
			const circles = parseInt(beatmap['count_normal']);
			const sliders = parseInt(beatmap['count_slider']);
			const spinners = parseInt(beatmap['count_spinner']);
			const playCount = parseInt(beatmap['playcount']);
			const passCount = parseInt(beatmap['passcount']);
			const passRate = (playCount / passCount) * 100;

			return {
				beatmapsetID: beatmap['beatmapset_id'],
				beatmapID: beatmap['beatmap_id'],
				difficultyName: beatmap['version'],
				difficultyStats: {
					cs: parseFloat(beatmap['diff_size']),
					od: parseFloat(beatmap['diff_overall']),
					ar: parseFloat(beatmap['diff_approach']),
					hp: parseFloat(beatmap['diff_drain'])
				},
				stars: {
					overall: parseFloat(beatmap['difficultyrating']),
					aim: parseFloat(beatmap['diff_aim']),
					speed: parseFloat(beatmap['diff_speed'])
				},
				artist: {
					value: beatmap['artist'],
					unicode: beatmap['artist_unicode']
				},
				title: {
					value: beatmap['title'],
					unicode: beatmap['title_unicode']
				},
				mapper: {
					username: beatmap['creator'],
					id: beatmap['creator_id']
				},
				bpm: parseFloat(beatmap['bpm']),
				source: beatmap['source'],
				tags: beatmap['tags'] ? beatmap['tags'].split(' ') : undefined,
				genre: this.constants.Beatmaps.genres[parseInt(beatmap['genre_id'])],
				language: this.constants.Beatmaps.langauge[parseInt(beatmap['language_id'])],
				approved: this.constants.Beatmaps.approved[parseInt(beatmap['approved'])],
				mode: this.constants.Beatmaps.modes[parseInt(beatmap['mode'])],
				playCount,
				passCount,
				passRate,
				objectCounts: {
					circles,
					sliders,
					spinners,
					total: circles + sliders + spinners
				},
				favourites: parseInt(beatmap['favourite_count']),
				rating: parseFloat(beatmap['rating']),
				totalLength: parseFloat(beatmap['total_length']),
				hitLength: parseFloat(beatmap['hit_length']),
				fileMD5: beatmap['file_md5'],
				submissionDate: new Date(beatmap['submit_date']),
				approvedDate: beatmap['approved_date'] ? new Date(beatmap['approved_date']) : undefined,
				lastUpdate: new Date(beatmap['last_update']),
				storyboard: beatmap['storyboard'] === '1',
				video: beatmap['video'] === '1',
				downloadUnavailable: beatmap['download_unavailable'] === '1',
				audioUnavailable: beatmap['audio_unavailable'] === '1'
			}
		});

		return parsedBeatmaps;
	}
}
