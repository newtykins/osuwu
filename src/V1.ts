import axios from 'axios';
import Constants from './Constants';
import * as countries from 'i18n-iso-countries';
import * as ojsama from 'ojsama';
import * as chalk from 'chalk';
import * as osuwu from './Types';

export default class V1 {
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

			keys.forEach((k, i) => {
				const value = parameters[k];

				if (value) {
					url += `&${k}=${value}`;
				}
			});
		}

		console.log(url);

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
	private formatScore(score: object): osuwu.V1.Score {
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
	public async getBeatmaps(options: osuwu.V1.BeatmapOptions = {}): Promise<osuwu.V1.Beatmap[]> {
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
		const parsedBeatmaps = beatmaps.map((beatmap): osuwu.V1.Beatmap => {
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
	 * Retrieve general user information
	 * @param u Either the user ID or username of the user you would like to find
	 * @param options Configuration of the parameters available for the endpoint
	 * @returns An object containing user information
	 * @async
	 */
	public async getUser(u: osuwu.UserType, options: osuwu.V1.UserOptions = {}): Promise<osuwu.V1.User> {
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

		const parsedUser: osuwu.V1.User = {
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
			events: user['events'] ? user['events'].map((event: object): osuwu.V1.Event => {
				return {
					html: event['display_html'],
					beatmapID: parseInt(event['beatmap_id']),
					beatmapsetID: parseInt(event['beatmapset_id']),
					date: new Date(event['date']),
					epicFactor: parseInt(event['epicfactor'])
				}
			}) : undefined
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
	public async getScores(beatmapID: number, options: osuwu.V1.ScoreOptions = {}): Promise<osuwu.V1.Score[]> {
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
		return scores.map((score): osuwu.V1.Score => this.formatScore(score));
	}

	/**
	 * Get the top scores for the specified user
	 * @param u Either the user ID or username of the user you would like to find
	 * @param options Configuration of the parameters available for the endpoint
	 * @returns A list containing top scores for a specified user
	 * @async
	 */
	public async getUserBest(u: osuwu.UserType, options: osuwu.BaseOptions = {}): Promise<osuwu.V1.BestScore[]> {
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
		return bestScores.map((score: any): osuwu.V1.BestScore => {
			score = this.formatScore(score);
			delete score.username;
			return score;
		});
	}

	/**
	 * Get the most recent plays over the last 24 hours for the specified user
	 * @param u Either the user ID or username of the user you would like to find
	 * @param options Configuration of the parameters available for the endpoint
	 * @returns A list containing the most recent scores for a specified user
	 * @async
	 */
	public async getUserRecent(u: osuwu.UserType, options: osuwu.BaseOptions = {}): Promise<osuwu.V1.RecentScore[]> {
		// Warn the user if fetch limit boundaries are not met
		this.checkLimits(1, 50, 'recent scores', options);

		// Make the request
		const recentScores = await this.makeRequest('get_user_recent', {
			u,
			m: options.mode,
			limit: options.limit,
			type: options.type
		});

		// Format the scores
		return recentScores.map((score: any): osuwu.V1.RecentScore => {
			score = this.formatScore(score);
			delete score.username;
			delete score.score_id;
			delete score.pp;
			delete score.replay_available;
			return score;
		});
	}

	/**
	 * Retrieve information about a multiplayer match
	 * @param id The ID of the match to get information about
	 * @returns An object containing match information, and a player's result
	 */
	public async getMatch(id: osuwu.ID): Promise<osuwu.V1.Match> {
		const match = await this.makeRequest('get_match', {
			mp: id
		});

		const games = match['games'].map((game): osuwu.V1.MatchGame => {
			const scores = game['scores'].map((score): osuwu.V1.MatchScore => {
				const count300 = parseInt(score['count300']);
				const count100 = parseInt(score['count100']);
				const count50 = parseInt(score['count50']);
				const totalHits = count300 + count100 + count50;
				const percentage300 = (count300 / totalHits) * 100;
				const percentage100 = (count100 / totalHits) * 100;
				const percentage50 = (count50 / totalHits) * 100;

				return {
					slot: parseInt(score['slot']),
					team: this.constants.Matches.teams[parseInt(score['team'])],
					userID: parseInt(score['user_id']),
					score: parseInt(score['score']),
					maxCombo: parseInt(score['max_combo']),
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
					pass: parseInt(score['pass']) === 1
				}
			})

			return {
				id: parseInt(game['game_id']),
				startTime: new Date(game['start_time']),
				endTime: game['end_time'] ? new Date(game['end_time']) : undefined,
				beatmapID: parseInt(game['beatmap_id']),
				mode: this.constants.Beatmaps.modes[parseInt(game['play_mode'])],
				scoringType: this.constants.Matches.scoringType[parseInt(game['scoring_type'])],
				teamType: this.constants.Matches.teamType[parseInt(game['team_type'])],
				mods: parseInt(game['mods']),
				scores
			}
		});

		return {
			id: parseInt(match['match']['match_id']),
			name: match['match']['name'],
			startTime: new Date(match['match']['start_time']),
			endTime: match['match']['end_time'] ? new Date(match['match']['end_time']) : undefined,
			games
		}
	}

	/**
	 * Get the replay data of a user's score on a map
	 * @description As this is quite a load-heavy request, it has special rules about rate limiting. You are only allowed to do 10 requests per minute. Also, please note that this request is not intended for batch retrievals.
	 * @param id The ID of the beatmap
	 * @param user The user who played the beatmap
	 * @returns An object containing the key "content", which is a base64-encoded replay.
	 */
	public async getReplay(id: osuwu.ID, user: string, options: osuwu.V1.ReplayOptions): Promise<osuwu.V1.Replay> {
		const replay = await this.makeRequest('get_replay', {
			b: id,
			u: user,
			m: options.mode,
			s: options.scoreID,
			type: options.type,
			mods: typeof options.mods === 'string' ? ojsama.modbits.from_string(options.mods) : options.mods
		});

		return {
			content: replay['content'],
			encoding: replay['encoding']
		}
	}
}
