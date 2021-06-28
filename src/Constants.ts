import * as ojsama from 'ojsama';

export default {
	// Enums for beatmaps
	Beatmaps: {
		/**
		 * Game modes
		 * @readonly
		 * @enum {string} 
		 */
		modes: Object.freeze({
			0: 'Standard',
			1: 'Taiko',
			2: 'Catch the Beat',
			3: 'Mania'
		}),
		/**
		 * Approval states
		 * @readonly
		 * @enum {string}
		 */
		approved: Object.freeze({
			'-2': 'Graveyard',
			'-1': 'WIP',
			0: 'Pending',
			1: 'Ranked',
			2: 'Approved',
			3: 'Qualified',
			4: 'Loved'
		}),
		/**
		 * Song genres
		 * @readonly
		 * @enum {string}
		 */
		genres: Object.freeze({
			0: 'Any',
			1: 'Unspecified',
			2: 'Video Game',
			3: 'Anime',
			4: 'Rock',
			5: 'Pop',
			6: 'Other',
			7: 'Novelty',
			9: 'Hip Hop',
			10: 'Electronic',
			11: 'Metal',
			12: 'Classical',
			13: 'Folk',
			14: 'Jazz'
		}),
		/**
		 * Song languages
		 * @readonly
		 * @enum {string}
		 */
		langauge: {
			0: 'Any',
			1: 'Other',
			2: 'English',
			3: 'Japanese',
			4: 'Chinese',
			5: 'Instrumental',
			6: 'Korean',
			7: 'French',
			8: 'German',
			9: 'Swedish',
			10: 'Spanish',
			11: 'Italian',
			12: 'Russian',
			13: 'Polish',
			14: 'Other'
		}
	},
	// Enum for matches
	Matches: {
		/**
		 * Scoring types
		 * @readonly
		 * @enum {string}
		 */
		scoringType: Object.freeze({
			0: 'Score',
			1: 'Accuracy',
			2: 'Combo',
			3: 'Score V2'
		}),
		/**
		 * Team types
		 * @readonly
		 * @enum {string}
		 */
		teamType: Object.freeze({
			0: 'Head to Head',
			1: 'Tag Co-op',
			2: 'Team vs',
			3: 'Tag Team vs'
		}),
		/**
		 * Teams
		 * @readonly
		 * @enum {string}
		 */
		teams: Object.freeze({
			0: 'None',
			1: 'Blue',
			2: 'Red'
		})
	},
	Mods: ojsama.modbits,
}
