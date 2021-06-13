import axios from 'axios';
import Constants from './Constants';
import * as countries from 'i18n-iso-countries';
import * as ojsama from 'ojsama';
import * as chalk from 'chalk';
import { BeatmapOptions, PPCalculatorOptions, PPCalculation, UserOptions, Beatmap, Event, User, ScoreOptions, Score, UserType, UserBestOptions } from './Types';

export default class osuwu {
	private apiKey: string;
	private baseUrl = 'https://osu.ppy.sh/api';
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
	private async makeRequest(endpoint: string, parameters?: object): Promise<object[]> {
		let url = `${this.baseUrl}/${endpoint}?k=${this.apiKey}`;

		if (parameters) {
			const keys = Object.keys(parameters);

			Object.values(parameters).forEach((value, i) => {
				if (value) {
					url += `&${keys[i]}=${value}`;
				}
			});
		}

		return (await (axios.get(url))).data;
	}

	/**
	 * Logs a warning using chalk
	 * @param msg The warn message
	 * @private
	 */
	private warn(msg: string) {
		console.log(chalk.yellow(chalk.bold(`WARN: ${msg}`)));
	}

	/**
	 * Warn when fetch limit boundaries are not met
	 * @param min The minimum amount fetchable
	 * @param max The maximum amount fetchable
	 * @param limitOf A noun describing what is being fetches
	 * @param options The options of the method
	 * @private
	 */
	private checkLimits(min: number, max: number, limitOf: string, options: object) {
		if (options['limit']) {
			if (options['limit'] <= min) {
				this.warn(`The minimum amount of ${limitOf} you can fetch is ${min}, so ${min} ${limitOf} has been returned!`);
			} else if (options['limit'] > max) {
				this.warn(`The maximum amount of ${limitOf} you can fetch is ${max}, so ${max} ${limitOf} have been returned!`);
			}
		}
	}

	/**
	 * Format a score object
	 * @param score An object of the score returned by the API
	 * @private
	 */
	private formatScore(score: object): Score {
		return {
			scoreID: parseInt(score['score_id']),
			score: parseInt(score['score']),
			username: score['username'],
			hitCounts: {
				300: parseInt(score['count300']),
				100: parseInt(score['count100']),
				50: parseInt(score['count50'])
			},
			missCount: parseInt(score['countmiss']),
			katuCount: parseInt(score['countkatu']),
			gekiCount: parseInt(score['countgeki']),
			maxCombo: parseInt(score['maxcombo']),
			perfectCombo: score['perfect'] === '1',
			mods: parseInt(score['enabled_mods']),
			userID: parseInt(score['user_id']),
			date: new Date(score['date']),
			rank: score['rank'],
			pp: parseInt(score['pp']),
			replayAvailable: score['replay_available'] === '1'
		}
	}

	/**
	 * Retrieve general beatmap information
	 * @param options Configuration of the parameters available for the endpoint
	 * @returns A list of all beatmaps (one per difficulty) matching criteria
	 * @async
	 */
	public async getBeatmaps(options: BeatmapOptions = {}): Promise<Beatmap[]> {
		// Warn the user if fetch limit boundaries are not met
		this.checkLimits(1, 500, 'beatmaps', options);

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
		});

		// Parse the beatmaps
		const parsedBeatmaps = beatmaps.map((beatmap): Beatmap => {
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
				artist: beatmap['artist'],
				title: beatmap['title'],
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
				objects: {
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
	 * Calculate the pp of a given beatmap
	 * @param beatmapID The ID of the beatmap to calculate for
	 * @param options Options for the PP calculator to process
	 * @returns Basic information about the beatmap + difficulty and pp stats
	 * @async
	 */
	public async calculatePP(beatmapID: string, options: PPCalculatorOptions = {}): Promise<PPCalculation> {
		// Download the beatmap file
		const osuFile = await axios.get(`https://osu.ppy.sh/osu/${beatmapID}`, { responseType: 'blob' });

		// Parse it
		const parser = new ojsama.parser().feed(osuFile.data);
		let mods = 0;
		let modsString = 'NM';
		let accuracy = 100;
		let miss = 0;
		const maxCombo = parser.map.max_combo();
		let combo = maxCombo;

		if (typeof options.mods === 'string') {
			mods = this.constants.Mods.from_string(options.mods);
			modsString = options.mods;
		} else {
			mods = options.mods;
			modsString = this.constants.Mods.string(options.mods);
		}

		if (options.accuracy) {
			accuracy = options.accuracy;
		}

		if (options.miss) {
			miss = options.miss;
		}

		if (options.combo) {
			combo = options.combo;
		}

		// Calculate difficulty and pp
		const stars = new ojsama.diff().calc({
			map: parser.map,
			mods,
		});
		const pp = ojsama.ppv2({
			stars,
			combo,
			nmiss: miss,
			acc_percent: accuracy,
			map: parser.map
		});
		const { computed_accuracy } = pp;
		
		// Find the beatmap by the ID
		const beatmap = (await this.getBeatmaps({ beatmapID }))[0];

		// Compile the rest of the data
		const data = {
			artist: beatmap.artist,
			title: beatmap.title,
			mapper: beatmap.mapper.username,
			difficulty: beatmap.difficultyName,
			beatmapID: beatmap.beatmapID,
			beatmapsetID: beatmap.beatmapsetID,
			cs: parser.map.cs,
			ar: parser.map.ar,
			od: parser.map.od,
			hp: parser.map.hp,
			objects: {
				total: parser.map.objects.length,
				circles: parser.map.ncircles,
				sliders: parser.map.nsliders,
				spinners: parser.map.nspinners
			},
			stars: {
				total: stars.total,
				aim: stars.aim,
				speed: stars.speed
			},
			mods: options && options.mods ? modsString : 'NM',
			combo: {
				top: combo,
				max: maxCombo
			},
			accuracy,
			pp: {
				total: pp.total,
				aim: pp.aim,
				speed: pp.speed,
				acc: pp.acc
			},
			computedAccuracy: {
				miss: computed_accuracy.nmiss,
				300: computed_accuracy.n300,
				100: computed_accuracy.n100,
				50: computed_accuracy.n50
			}
		}

		return data;
	}

	/**
	 * Retrieve general user information
	 * @param u Either the user ID or username of the user you would like to find
	 * @param options Configuration of the parameters available for the endpoint
	 * @returns A list containing user information
	 * @async
	 */
	public async getUser(u: UserType, options: UserOptions = {}): Promise<User> {
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
		const percentage100 = (count100 / totalHits) * 100;
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
			events = user['events'].map((event: object): Event => {
				return {
					html: event['display_html'],
					beatmapID: parseInt(event['beatmap_id']),
					beatmapsetID: parseInt(event['beatmapset_id']),
					date: new Date(event['date']),
					epicFactor: parseInt(event['epicfactor'])
				}
			});
		}

		const parsedUser: User = {
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
					percentage: percentage100
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

	/**
	 * Retrieve information about the top 100 scores of a specified beatmap
	 * @param beatmapID The ID of the beatmap to search for scores for
	 * @param options Configuration of the parameters available for the endpoint
	 * @returns A list containing top scores for a specified beatmap
	 * @async 
	 */
	public async getScores(beatmapID: number, options: ScoreOptions = {}): Promise<Score[]> {
		// Warn the user if fetch limit boundaries are not met
		this.checkLimits(1, 100, 'scores', options);

		// Make the request
		const scores = await this.makeRequest('get_scores', {
			b: beatmapID,
			u: options.user,
			m: options.mode,
			mods: typeof options.mods === 'string' ? ojsama.modbits.from_string(options.mods) : options.mods,
			type: options.type,
			limit: options.limit
		});

		// Format the scores
		return scores.map((score): Score => this.formatScore(score));
	}

	/**
	 * Get the top scores for the specified user
	 * @param u Either the user ID or username of the user you would like to find
	 * @param options Configuration of the parameters available for the endpoint
	 * @returns A list containing top scores for a specified user
	 * @async
	 */
	public async getUserBest(u: UserType, options: UserBestOptions = {}): Promise<Omit<Score, 'username'>[]> {
		// Warn the user if fetch limit boundaries are not met
		this.checkLimits(1, 100, 'top scores', options);

		// Make the request
		const bestScores = await this.makeRequest('get_user_best', {
			u,
			m: options.mode,
			limit: options.limit,
			type: options.type
		});

		// Format the scores
		return bestScores.map((score: any): Omit<Score, 'username'> => {
			delete score.username;
			return score;
		});
	}
}
