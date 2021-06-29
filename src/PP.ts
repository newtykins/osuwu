import axios from 'axios';
import * as ojsama from 'ojsama';
import Constants from './Constants';
import * as chalk from 'chalk';
import * as osuwu from './Types';

export default class PP {
	/**
	 * Calculate the pp of a given beatmap
	 * @param beatmapID The ID of the beatmap
	 * @param options Options for the PP calculator to process
	 * @returns Basic information about the beatmap + difficulty and pp stats
	 * @async
	 */
	 public async calculatePP(beatmapID: string | number, options: osuwu.PP.Options = {}): Promise<osuwu.PP.Calculation> {
		// Download the beatmap file
		const osuFile = await axios.get(`https://osu.ppy.sh/osu/${beatmapID}`, { responseType: 'blob' });

		if (!osuFile.data) {
			console.log(chalk.red(chalk.bold(`ERROR: ${beatmapID} is not the ID of a valid beatmap.`)));
			return undefined;
		}

		// Parse it
		const parser = new ojsama.parser().feed(osuFile.data);
		let mods = 0;
		let modsString = 'NM';
		let accuracy = 100;
		let miss = 0;
		const maxCombo = parser.map.max_combo();
		let combo = maxCombo;

		if (typeof options.mods === 'string') {
			mods = Constants.Mods.from_string(options.mods);
			modsString = options.mods;
		} else {
			mods = options.mods;
			modsString = Constants.Mods.string(options.mods);
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

		// Compile the rest of the data
		const data = {
			id: beatmapID,
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
}
