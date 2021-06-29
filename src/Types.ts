import Constants from './Constants';

type PrependNextNum<A extends Array<unknown>> = A['length'] extends infer T ? ((t: T, ...a: A) => void) extends ((...x: infer X) => void) ? X : never : never;
type EnumerateInternal<A extends Array<unknown>, N extends number> = { 0: A, 1: EnumerateInternal<PrependNextNum<A>, N> }[N extends A['length'] ? 0 : 1];
type Enumerate<N extends number> = EnumerateInternal<[], N> extends (infer E)[] ? E : never;
type Range<FROM extends number, TO extends number> = Exclude<Enumerate<TO>, Enumerate<FROM>>;

export type UserType = 'id' | 'username';
export type ID = string | number;

export interface ObjectCount {
	total: number;
	circles: number;
	sliders: number;
	spinners: number;
}

export interface HitCounts {
	300: {
		amount: number;
		percentage: number;
	}
	100: {
		amount: number;
		percentage: number;
	}
	50: {
		amount: number;
		percentage: number;
	}
}

export namespace V2 {
	export interface Covers {
		cover: string;
		cover2x: string;
		card: string;
		card2x: string;
		list: string;
		list2x: string;
		slimcover: string;
		slimcover2x: string;
	}

	export interface BeatmapsetCompact {
		artist: string;
		artistUnicode: string;
		covers: Covers;
		mapper: string;
		favouriteCount: number;
		beatmapsetID: number;
		nsfw: boolean;
		playCount: number;
		previewURL: string;
		source: string;
		status: string;
		title: string;
		titleUnicode: string;
		userID: number;
		video: string;
	}

	export interface Beatmapset extends BeatmapsetCompact {
		availability: {
			downloadDisabled: boolean;
			moreInformation: string;
		}
		bpm: number;
		canBeHyped: boolean;
		discussion: {
			enabled: boolean;
			locked: boolean;
		}
		hype: {
			current: number;
			required: number;
		}
		isScoreable: boolean;
		lastUpdated: Date;
		legacyThreadURL: string;
		nominations: {
			current: number;
			required: number;
		}
		ranked: string;
		rankedDate: Date;
		storyboard: boolean;
		submittedDate: Date;
		tags: string[];
	}

	export interface BeatmapCompact {
		beatmapID: number;
		difficultyName: string;
		difficultyRating: number;
		totalLength: number;
		status: string;
		mode: string;
	}

	export interface Failtimes {
		exit: number[];
		fail: number[];
	}

	export interface Beatmap extends BeatmapCompact {
		difficultyStats: {
			ar: number;
			cs: number;
			hp: number;
			od: number;
		}
		beatmapset: Beatmapset;
		failtimes: Failtimes;
		maxCombo: number;
		beatmapsetID: number;
		bpm: number;
		convert: boolean;
		objects: ObjectCount;
		deletedAt: Date;
		hitLength: number;
		isScoreable: boolean;
		lastUpdated: Date;
		passCount: number;
		playCount: number;
		ranked: number;
		url: string;
	}
}

export namespace V1 {	
	export type BestScore = Omit<V1.Score, 'username'>;
	export type RecentScore = Omit<Omit<Omit<BestScore, 'score_id'>, 'pp'>, 'replay_available'>;

	export interface BaseOptions {
		mode?: keyof typeof Constants.Beatmaps.modes;
		limit?: number;
		type?: UserType;
	}
	export interface BeatmapOptions {
		since?: Date;
		beatmapsetID?: string;
		beatmapID?: string;
		user?: string;
		userType?: UserType;
		mode?: keyof typeof Constants.Beatmaps.modes,
		converted?: boolean;
		hash?: string;
		limit?: number;
	}
	
	export interface Beatmap {
		beatmapsetID: number;
		beatmapID: number;
		difficultyName: string;
		difficultyStats: {
			cs: number;
			od: number;
			ar: number;
			hp: number;
		}
		stars: {
			overall: number;
			aim: number;
			speed: number;
		}
		artist: string;
		title: string;
		mapper: {
			username: string;
			userID: string;
		}
		bpm: number;
		source: string;
		tags: string[];
		genre: string;
		language: string;
		approved: string;
		mode: string;
		playCount: number;
		passCount: number;
		passPercentage: number;
		objects: ObjectCount;
		cover: {
			image: string;
			thumbnail: string;
		}
		favourites: number;
		rating: number;
		totalLengthSeconds: number;
		hitLengthSeconds: number;
		fileMD5: string;
		submissionDate: Date;
		approvedDate: Date;
		lastUpdate: Date;
		storyboard: boolean;
		video: boolean;
		downloadUnavailable: boolean;
		audioUnavailable: boolean;
	}
	
	export interface UserOptions {
		mode?: keyof (typeof Constants.Beatmaps.modes);
		userType?: UserType;
		eventDays?: Range<1, 32>;
	}
	
	export interface Event {
		html: string;
		beatmapID: number;
		beatmapsetID: number;
		date: Date;
		epicFactor: number;
	}
	
	export interface User {
		userID: number;
		username: string;
		avatarURL: string;
		joinDate: Date;
		hitCounts: HitCounts;
		playCount: number;
		level: number;
		rank: number;
		countryRank: number;
		pp: number;
		accuracy: number;
		score: {
			total: number;
			ranked: number;
			unranked: number;
			perPlay: number;
		}
		ranks: {
			SS: {
				gold: number;
				silver: number;
				total: number;
			}
			S: {
				gold: number;
				silver: number;
				total: number;
			}
			a: number;
		}
		country: string;
		secondsPlayed: number;
		events: Event[];
	}
	
	export interface ScoreOptions extends BaseOptions {
		user?: number;
		mods?: number | string;
	}
	
	export interface Score {
		scoreID: number;
		score: number;
		username: string;
		hitCounts: {
			300: number;
			100: number;
			50: number;
		}
		missCount: number;
		katuCount: number;
		gekiCount: number;
		maxCombo: number;
		perfectCombo: boolean;
		mods: number;
		userID: number;
		date: Date;
		rank: string;
		pp: number;
		replayAvailable: boolean;
	}	

	export interface MatchScore {
		slot: number;
		team: string;
		userID: number;
		score: number;
		maxCombo: number;
		hitCounts: HitCounts;
		pass: boolean;
	}

	export interface MatchGame {
		gameID: number;
		startTime: Date;
		endTime: Date;
		beatmapID: number;
		mode: string;
		scoringType: string;
		teamType: string;
		mods: number;
		scores: MatchScore[];
	}

	export interface Match {
		matchID: number;
		name: string;
		startTime: Date;
		endTime: Date;
		games: MatchGame[];
	}

	export interface ReplayOptions {
		mode?: keyof typeof Constants.Beatmaps.modes;
		scoreID?: number;
		type?: UserType;
		mods?: number | string;
	}

	export interface Replay {
		content: string;
		encoding: string;
	}
}

export namespace PP {
	export interface Options {
		mods?: number | string;
		combo?: number;
		miss?: number;
		accuracy?: number;
	}
	
	export interface Calculation {
		cs: number;
		ar: number;
		od: number;
		hp: number;
		objects: ObjectCount;
		stars: {
			total: number;
			aim: number;
			speed: number;
		}
		mods: string;
		combo: {
			top: number;
			max: number;
		}
		accuracy: number;
		pp: {
			total: number;
			aim: number;
			speed: number;
			acc: number;
		}
		computedAccuracy: {
			miss: number;
			300: number;
			100: number;
			50: number;
		}
	}
}
