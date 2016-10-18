/*
Copyright (C) 2016  Cristian Filipov

This file is part of MuscleBook.

MuscleBook is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

MuscleBook is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with MuscleBook.  If not, see <http://www.gnu.org/licenses/>.
*/
function muscleMovements(e) {
	var mx = e.Muscles
	var result = []
	for (var key in mx) {
		result = result.concat(
			mx[key].map(function(d) { return { fmaID: d, movement: key }; }));
	}
	return result;
}

function muscleList(e) {
	var mx = e.Muscles;
	var result = [];
	for (var key in mx) {
		result = result.concat(mx[key].map(function(d) { return d; }));
	}
	return result.filter(m => !isNaN(m) && muscles[m] != null);
}

function individualMuscles(e) {
	return new Set(muscleList(e).flatMap(flattenedMuscleComponents));
}

 function muscleComponents(m) {
	if (m instanceof Array) { return m.flatMap(muscleComponents) }
	if (isNaN(m.fmaID)) { return [] }
	if (!m.hasOwnProperty("role")) { return [] }
	let muscle = muscleLookup[m.fmaID];
	if (!muscle) { return [] }
	if (muscle.components.length === 0) { return [m] }
	return muscle.components.map(c => ({ fmaID: c, role: m.role })); 
}

function flattenedMuscleComponents(m) {
	if (m instanceof Array) { return m.flatMap(flattenedMuscleComponents) }
	if (isNaN(m.fmaID)) { return [] }
	if (!m.hasOwnProperty("role")) { return [] }
	let muscle = muscleLookup[m.fmaID];
	if (!muscle) { return [] }
	if (muscle.components.length === 0) { return [m] }
	return muscleComponents(m).flatMap(flattenedMuscleComponents);
}

function displayableMuscleComponents(m) {
	if (m instanceof Array) { return m.flatMap(displayableMuscleComponents) }
	if (isNaN(m.fmaID)) { return [] }
	if (!m.hasOwnProperty("role")) { return [] }
	let muscle = muscleLookup[m.fmaID];
	if (!muscle) { return [] }
	if (muscle.displayable) { return [m] }
	if (muscle.components.length === 0) { return [] }
	return muscleComponents(m).flatMap(displayableMuscleComponents);
}

muscleLookup = {
	74997: {
		name: "Abductor",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	38506: {
		name: "Extensor Carpi Ulnaris",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	38518: {
		name: "Extensor Pollicis Brevis",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	38521: {
		name: "Entensor Pollicis Longus",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	37704: {
		name: "Anconeus",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	74998: {
		name: "Adductor",
		direction: "Anterior",
		components: [],
		synonyms: ["Inner Thigh"],
		displayable: true
	},
	83003: {
		name: "Anterior Deltoid",
		direction: "Anterior",
		components: [],
		synonyms: ["Deltoid Anterior"],
		displayable: true
	},
	37670: {
		name: "Biceps",
		direction: "Anterior",
		components: [],
		synonyms: ["Biceps brachii"],
		displayable: true
	},
	22356: {
		name: "Biceps Femoris",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	38485: {
		name: "Brachioradialis",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	37664: {
		name: "Coracobrachialis",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	13335: {
		name: "External Obliques",
		direction: "Anterior",
		components: [],
		synonyms: ["External Oblique","Obliques"],
		displayable: true
	},
	38459: {
		name: "Flexor Carpi Radialis",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	38465: {
		name: "Flexor Carpi Ulnaris",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	38469: {
		name: "Flexor Digitorum Superficialis",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	38500: {
		name: "Extensor Digitorum",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	45959: {
		name: "Gastrocnemius (Lateral head)",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	45956: {
		name: "Gastrocnemius (Medial Head)",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	22541: {
		name: "Gastrocnemius",
		direction: "Posterior",
		components: [45956,45959],
		synonyms: ["Gastrocnemius"],
		displayable: false
	},
	22314: {
		name: "Gluteus Maximus",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	22315: {
		name: "Gluteus Medius",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	22317: {
		name: "Gluteus Minimus",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	51048: {
		name: "Iliotibial Band",
		direction: "Posterior",
		components: [],
		synonyms: ["Semimembranosus"],
		displayable: true
	},
	32546: {
		name: "Infraspinatus",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	83006: {
		name: "Lateral Deltoid",
		direction: "Anterior",
		components: [],
		synonyms: ["Intermediate Deltoid","Deltoid Lateral"],
		displayable: true
	},
	13357: {
		name: "Latissimus dorsi",
		direction: "Posterior",
		components: [],
		synonyms: ["Lats","Lat"],
		displayable: true
	},
	32519: {
		name: "Levator scapulae",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	22538: {
		name: "Peroneus",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	83007: {
		name: "Posterior Deltoid",
		direction: "Posterior",
		components: [],
		synonyms: ["Deltoid Posterior"],
		displayable: true
	},
	9628: {
		name: "Rectus Abdominis",
		direction: "Anterior",
		components: [],
		synonyms: ["Rectus Abdominus"],
		displayable: true
	},
	22430: {
		name: "Rectus Femoris",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	13379: {
		name: "Rhomboid Major",
		direction: "Posterior",
		components: [],
		synonyms: ["Rhomboids"],
		displayable: true
	},
	13380: {
		name: "Rhomboid Minor",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	22353: {
		name: "Sartorius",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	22357: {
		name: "Semitendinosus",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	13397: {
		name: "Serratus Anterior",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	22542: {
		name: "Soleus",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	13413: {
		name: "Subscapularis",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	9629: {
		name: "Supraspinatus",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	32549: {
		name: "Teres Major",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	32550: {
		name: "Teres Minor",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	15570: {
		name: "Transversus Abdominis",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	32555: {
		name: "Trapezius (Lower Fibers)",
		direction: "Posterior",
		components: [],
		synonyms: ["Trapezius (descending part)","Trapezius Lower","Lower Trapezius"],
		displayable: true
	},
	32557: {
		name: "Trapezius (Upper Fibers)",
		direction: "Posterior",
		components: [],
		synonyms: ["Trapezius (ascending part)","Trapezius Upper","Upper Trapezius)"],
		displayable: true
	},
	32556: {
		name: "Trapezius (Middle Fibers)",
		direction: "Posterior",
		components: [],
		synonyms: ["Trapezius (transverse part)","Trapezius Middle","Middle Trapezius"],
		displayable: true
	},
	51062: {
		name: "Triceps surae",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	22433: {
		name: "Vastus interMedius",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	22431: {
		name: "Vastus Lateralis",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	22432: {
		name: "Vastus Medialis",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	37692: {
		name: "Triceps (Long Head)",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	37694: {
		name: "Triceps (Lateral Head)",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	77177: {
		name: "Iliocostalis",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	77178: {
		name: "Longissimus",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	77179: {
		name: "Spinalis",
		direction: "Posterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	13109: {
		name: "Pectoralis Minor",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	34687: {
		name: "Pectoralis Major (Clavicular)",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: true
	},
	34696: {
		name: "Pectoralis Major (Sternal)",
		direction: "Anterior",
		components: [],
		synonyms: ["Pectoralis Sternocostal"],
		displayable: true
	},
	18060: {
		name: "Psoas Major",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	22310: {
		name: "Iliacus",
		direction: "Anterior",
		components: [],
		synonyms: [],
		displayable: false
	},
	64918: {
		name: "Iliopsoas",
		direction: "Anterior",
		components: [18060,22310],
		synonyms: ["Inner hip muscles","dorsal hip muscles","hip flexors"],
		displayable: false
	},
	71302: {
		name: "Erector spinae",
		direction: "Posterior",
		components: [77177,77178,77179],
		synonyms: [],
		displayable: true
	},
	10: {
		name: "Lower Back",
		direction: "Posterior",
		components: [71302],
		synonyms: [],
		displayable: false
	},
	37371: {
		name: "Forearms",
		direction: "Anterior",
		components: [37704,38465,38485,38500,38506,38518,38521,38459,38469],
		synonyms: ["Forearms"],
		displayable: false
	},
	11: {
		name: "Middle Back",
		direction: "Posterior",
		components: [13379,32555],
		synonyms: [],
		displayable: false
	},
	12: {
		name: "Abductors",
		direction: "Posterior",
		components: [22317,22315],
		synonyms: ["Abductor"],
		displayable: false
	},
	32521: {
		name: "Deltoids",
		direction: "Anterior",
		components: [83003,83006,83007],
		synonyms: ["Deltoid"],
		displayable: false
	},
	9626: {
		name: "Trapezius",
		direction: "Posterior",
		components: [32555,32557,32556],
		synonyms: ["Traps"],
		displayable: false
	},
	82650: {
		name: "Rotator Cuff",
		direction: "Posterior",
		components: [32546,32550,13413,9629],
		synonyms: [],
		displayable: false
	},
	37688: {
		name: "Triceps",
		direction: "Posterior",
		components: [37692,37694],
		synonyms: ["Triceps brachii","Tricep"],
		displayable: false
	},
	33531: {
		name: "Shoulders",
		direction: "Posterior",
		components: [32521,82650,32549],
		synonyms: ["Shoulders"],
		displayable: false
	},
	37370: {
		name: "Arm",
		direction: "Anterior",
		components: [37670,37688,37371,33531],
		synonyms: [],
		displayable: false
	},
	85216: {
		name: "Back",
		direction: "Posterior",
		components: [13357,13379,13380,32546,32549,32550,71302],
		synonyms: ["General Back","Back General"],
		displayable: false
	},
	64922: {
		name: "Glutes",
		direction: "Posterior",
		components: [22314,22315],
		synonyms: [],
		displayable: false
	},
	22428: {
		name: "Quadriceps",
		direction: "Anterior",
		components: [74998,22430,22431,22432],
		synonyms: ["Quadriceps Femoris"],
		displayable: false
	},
	81022: {
		name: "Hamstrings",
		direction: "Posterior",
		components: [22356,22357,51048],
		synonyms: [],
		displayable: false
	},
	50208: {
		name: "Thigh",
		direction: "Anterior",
		components: [22428,81022],
		synonyms: ["Thighs"],
		displayable: false
	},
	65004: {
		name: "Calves",
		direction: "Posterior",
		components: [22538,22542,45956,45959],
		synonyms: ["Calf"],
		displayable: false
	},
	9622: {
		name: "Legs",
		direction: "Anterior",
		components: [50208,65004],
		synonyms: ["Leg"],
		displayable: false
	},
	78435: {
		name: "Abdominals",
		direction: "Anterior",
		components: [9628,13335,13397],
		synonyms: ["Abs","Ab","Core"],
		displayable: false
	},
	9627: {
		name: "Pectoralis Major",
		direction: "Anterior",
		components: [34696,34687],
		synonyms: [],
		displayable: false
	},
	50223: {
		name: "Pectorals",
		direction: "Anterior",
		components: [9627,13109],
		synonyms: ["Pecs","Pectoralis","Chest"],
		displayable: false
	},
}
