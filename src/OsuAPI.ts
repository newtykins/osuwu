import axios from 'axios';
import Constants from './Constants';
import * as countries from 'i18n-iso-countries';

type UserType = 'id' | 'username';
type PrependNextNum<A extends Array<unknown>> = A['length'] extends infer T ? ((t: T, ...a: A) => void) extends ((...x: infer X) => void) ? X : never : never;
type EnumerateInternal<A extends Array<unknown>, N extends number> = { 0: A, 1: EnumerateInternal<PrependNextNum<A>, N> }[N extends A['length'] ? 0 : 1];
export type Enumerate<N extends number> = EnumerateInternal<[], N> extends (infer E)[] ? E : never;
export type Range<FROM extends number, TO extends number> = Exclude<Enumerate<TO>, Enumerate<FROM>>;

interface BeatmapOptions {
	since?: Date;
	beatmapsetID?: string;
	beatmapID?: string;
	user?: string;
	userType?: UserType;
	mode?: keyof (typeof Constants.Beatmaps.modes),
	converted?: boolean;
	hash?: string;
	limit?: number;
}

interface UserOptions {
	mode?: keyof (typeof Constants.Beatmaps.modes);
	userType?: UserType;
	eventDays: Range<1, 32>;
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
			const passPercentage = (playCount / passCount) * 100;
			const beatmapsetID = parseInt(beatmap['beatmapset_id']);
			const beatmapID = parseInt(beatmap['beatmap_id']);
			const coverImage = `https://assets.ppy.sh/beatmaps/${beatmapsetID}/covers/cover.jpg`;
			const coverThumbnail = `https://b.ppy.sh/thumb/${beatmapsetID}l.jpg`; 

			return {
				beatmapsetID,
				beatmapID,
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
				passPercentage,
				objectCounts: {
					circles,
					sliders,
					spinners,
					total: circles + sliders + spinners
				},
				cover: {
					image: coverImage,
					thumbnail: coverThumbnail
				},
				favourites: parseInt(beatmap['favourite_count']),
				rating: parseFloat(beatmap['rating']),
				totalLengthSeconds: parseFloat(beatmap['total_length']),
				hitLengthSeconds: parseFloat(beatmap['hit_length']),
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

	/**
	 * Retrieve general user information
	 * @param u Either the user ID or username of the user you would like to find
	 * @param options Configuration of the parameters available for the endpoint
	 * @async
	 */
	public async getUser(u: string, options?: UserOptions) {
		const user = (await this.makeRequest('get_user', options ? {
			u,
			m: options.mode,
			type: options.userType,
			'event_days': options.eventDays
		} : { u }))[0];

		// General
		const userID = parseInt(user['user_id']);
		const avatarURL = `https://a.ppy.sh/${userID}`;
		const playCount = parseInt(user['playcount']);

		// Hit counts and ratios
		const count300 = parseInt(user['count300']);
		const count100 = parseInt(user['count100']);
		const count50 = parseInt(user['count50']);
		const totalHits = count300 + count100 + count50;
		const percentage300 = (count300 / totalHits) * 100;
		const perecentage100 = (count100 / totalHits) * 100;
		const percentage50 = (count50 / totalHits) * 100;

		// Score
		const rankedScore = parseInt(user['ranked_score']);
		const totalScore = parseInt(user['total_score']);
		const unrankedScore = totalScore - rankedScore;
		const scorePerPlay = totalScore / playCount;
		
		// Ranks
		const ssGold = parseInt(user['count_rank_ss']);
		const ssSilver = parseInt(user['count_rank_ssh']);
		const ssTotal = ssGold + ssSilver;
		const sGold = parseInt(user['count_rank_s']);
		const sSilver = parseInt(user['count_rank_sh']);
		const sTotal = sGold + sSilver;

		// Events
		let events = undefined;

		if (user['events']) {
			events = user['events'].map((event: object) => {
				return {
					html: event['display_html'],
					beatmapID: parseInt(event['beatmap_id']),
					beatmapsetID: parseInt(event['beatmapset_id']),
					date: new Date(event['date']),
					epicFactor: parseInt(event['epicfactor'])
				}
			});
		}

		const parsedUser = {
			userID,
			username: user['username'],
			avatarURL,
			joinDate: new Date(user['join_date']),
			hitCounts: {
				300: {
					amount: count300,
					percentage: percentage300
				},
				100: {
					amount: count100,
					percentage: perecentage100
				},
				50: {
					amount: count50,
					percentage: percentage50
				}
			},
			playCount,
			level: parseFloat(user['level']),
			rank: parseInt(user['pp_rank']),
			countryRank: parseInt(user['pp_country_rank']),
			pp: parseInt(user['pp_raw']),
			accuracy: parseFloat(user['accuracy']),
			score: {
				total: totalScore,
				ranked: rankedScore,
				unranked: unrankedScore,
				perPlay: scorePerPlay
			},
			ranks: {
				SS: {
					gold: ssGold,
					silver: ssSilver,
					total: ssTotal
				},
				S: {
					gold: sGold,
					silver: sSilver,
					total: sTotal
				},
				a: parseInt(user['count_rank_a'])
			},
			country: countries.getName(user['country'], 'en', { select: 'official' }),
			secondsPlayed: parseInt(user['total_seconds_played']),
			events
		}

		return parsedUser;
	}
}
