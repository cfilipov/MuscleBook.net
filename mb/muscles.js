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

mb.Muscle = ((d3)=>{

const muscleLookup = {};

const Muscle = class {
	constructor({id, name, direction, components, synonyms, displayable}) {
		this.id = id;
		this.name = name;
		this.direction = direction;
		this.components = components;
		this.synonyms = synonyms;
		this.displayable = displayable;
	}

	static withID(mid) {
		return muscleLookup[mid];
	}

	static all() {
		return d3.entries(muscleLookup);
	}

	static displayable() {
		return this.all().filter(m => m.value.displayable);
	}

	individualComponents() {
		if (this.components.length === 0) { return [this]; }
		return this.components.flatMap(m => m.flattenedComponents());
	}

	displayableComponents() { 
		if (this.displayable) return [this];
		if (this.components.length === 0) return [];
		return this.components.flatMap(m => m.displayableComponents());
	}
};

muscleLookup['74997'] = new Muscle({
	id: 74997,
	name: 'Abductor',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['38506'] = new Muscle({
	id: 38506,
	name: 'Extensor Carpi Ulnaris',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['38518'] = new Muscle({
	id: 38518,
	name: 'Extensor Pollicis Brevis',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['38521'] = new Muscle({
	id: 38521,
	name: 'Entensor Pollicis Longus',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['37704'] = new Muscle({
	id: 37704,
	name: 'Anconeus',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['74998'] = new Muscle({
	id: 74998,
	name: 'Adductor',
	direction: 'Anterior',
	components: [],
	synonyms: ['Inner Thigh'],
	displayable: true
});
muscleLookup['83003'] = new Muscle({
	id: 83003,
	name: 'Anterior Deltoid',
	direction: 'Anterior',
	components: [],
	synonyms: ['Deltoid Anterior'],
	displayable: true
});
muscleLookup['37670'] = new Muscle({
	id: 37670,
	name: 'Biceps',
	direction: 'Anterior',
	components: [],
	synonyms: ['Biceps brachii'],
	displayable: true
});
muscleLookup['22356'] = new Muscle({
	id: 22356,
	name: 'Biceps Femoris',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['38485'] = new Muscle({
	id: 38485,
	name: 'Brachioradialis',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['37664'] = new Muscle({
	id: 37664,
	name: 'Coracobrachialis',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['13335'] = new Muscle({
	id: 13335,
	name: 'External Obliques',
	direction: 'Anterior',
	components: [],
	synonyms: ['External Oblique','Obliques'],
	displayable: true
});
muscleLookup['38459'] = new Muscle({
	id: 38459,
	name: 'Flexor Carpi Radialis',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['38465'] = new Muscle({
	id: 38465,
	name: 'Flexor Carpi Ulnaris',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['38469'] = new Muscle({
	id: 38469,
	name: 'Flexor Digitorum Superficialis',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['38500'] = new Muscle({
	id: 38500,
	name: 'Extensor Digitorum',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['45959'] = new Muscle({
	id: 45959,
	name: 'Gastrocnemius (Lateral head)',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['45956'] = new Muscle({
	id: 45956,
	name: 'Gastrocnemius (Medial Head)',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['22541'] = new Muscle({
	id: 22541,
	name: 'Gastrocnemius',
	direction: 'Posterior',
	components: [45956,45959],
	synonyms: ['Gastrocnemius'],
	displayable: false
});
muscleLookup['22314'] = new Muscle({
	id: 22314,
	name: 'Gluteus Maximus',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['22315'] = new Muscle({
	id: 22315,
	name: 'Gluteus Medius',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['22317'] = new Muscle({
	id: 22317,
	name: 'Gluteus Minimus',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['51048'] = new Muscle({
	id: 51048,
	name: 'Iliotibial Band',
	direction: 'Posterior',
	components: [],
	synonyms: ['Semimembranosus'],
	displayable: true
});
muscleLookup['32546'] = new Muscle({
	id: 32546,
	name: 'Infraspinatus',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['83006'] = new Muscle({
	id: 83006,
	name: 'Lateral Deltoid',
	direction: 'Anterior',
	components: [],
	synonyms: ['Intermediate Deltoid','Deltoid Lateral'],
	displayable: true
});
muscleLookup['13357'] = new Muscle({
	id: 13357,
	name: 'Latissimus dorsi',
	direction: 'Posterior',
	components: [],
	synonyms: ['Lats','Lat'],
	displayable: true
});
muscleLookup['32519'] = new Muscle({
	id: 32519,
	name: 'Levator scapulae',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['22538'] = new Muscle({
	id: 22538,
	name: 'Peroneus',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['83007'] = new Muscle({
	id: 83007,
	name: 'Posterior Deltoid',
	direction: 'Posterior',
	components: [],
	synonyms: ['Deltoid Posterior'],
	displayable: true
});
muscleLookup['9628'] = new Muscle({
	id: 9628,
	name: 'Rectus Abdominis',
	direction: 'Anterior',
	components: [],
	synonyms: ['Rectus Abdominus'],
	displayable: true
});
muscleLookup['22430'] = new Muscle({
	id: 22430,
	name: 'Rectus Femoris',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['13379'] = new Muscle({
	id: 13379,
	name: 'Rhomboid Major',
	direction: 'Posterior',
	components: [],
	synonyms: ['Rhomboids'],
	displayable: true
});
muscleLookup['13380'] = new Muscle({
	id: 13380,
	name: 'Rhomboid Minor',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['22353'] = new Muscle({
	id: 22353,
	name: 'Sartorius',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['22357'] = new Muscle({
	id: 22357,
	name: 'Semitendinosus',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['13397'] = new Muscle({
	id: 13397,
	name: 'Serratus Anterior',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['22542'] = new Muscle({
	id: 22542,
	name: 'Soleus',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['13413'] = new Muscle({
	id: 13413,
	name: 'Subscapularis',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['9629'] = new Muscle({
	id: 9629,
	name: 'Supraspinatus',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['32549'] = new Muscle({
	id: 32549,
	name: 'Teres Major',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['32550'] = new Muscle({
	id: 32550,
	name: 'Teres Minor',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['15570'] = new Muscle({
	id: 15570,
	name: 'Transversus Abdominis',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['32555'] = new Muscle({
	id: 32555,
	name: 'Trapezius (Lower Fibers)',
	direction: 'Posterior',
	components: [],
	synonyms: ['Trapezius (descending part)','Trapezius Lower','Lower Trapezius'],
	displayable: true
});
muscleLookup['32557'] = new Muscle({
	id: 32557,
	name: 'Trapezius (Upper Fibers)',
	direction: 'Posterior',
	components: [],
	synonyms: ['Trapezius (ascending part)','Trapezius Upper','Upper Trapezius)'],
	displayable: true
});
muscleLookup['32556'] = new Muscle({
	id: 32556,
	name: 'Trapezius (Middle Fibers)',
	direction: 'Posterior',
	components: [],
	synonyms: ['Trapezius (transverse part)','Trapezius Middle','Middle Trapezius'],
	displayable: true
});
muscleLookup['51062'] = new Muscle({
	id: 51062,
	name: 'Triceps surae',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['22433'] = new Muscle({
	id: 22433,
	name: 'Vastus interMedius',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['22431'] = new Muscle({
	id: 22431,
	name: 'Vastus Lateralis',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['22432'] = new Muscle({
	id: 22432,
	name: 'Vastus Medialis',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['37692'] = new Muscle({
	id: 37692,
	name: 'Triceps (Long Head)',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['37694'] = new Muscle({
	id: 37694,
	name: 'Triceps (Lateral Head)',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['77177'] = new Muscle({
	id: 77177,
	name: 'Iliocostalis',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['77178'] = new Muscle({
	id: 77178,
	name: 'Longissimus',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['77179'] = new Muscle({
	id: 77179,
	name: 'Spinalis',
	direction: 'Posterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['13109'] = new Muscle({
	id: 13109,
	name: 'Pectoralis Minor',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['34687'] = new Muscle({
	id: 34687,
	name: 'Pectoralis Major (Clavicular)',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: true
});
muscleLookup['34696'] = new Muscle({
	id: 34696,
	name: 'Pectoralis Major (Sternal)',
	direction: 'Anterior',
	components: [],
	synonyms: ['Pectoralis Sternocostal'],
	displayable: true
});
muscleLookup['18060'] = new Muscle({
	id: 18060,
	name: 'Psoas Major',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: false
});
muscleLookup['22310'] = new Muscle({
	id: 22310,
	name: 'Iliacus',
	direction: 'Anterior',
	components: [],
	synonyms: [],
	displayable: false
});

/*
 Muscle groups
 */

muscleLookup['64918'] = new Muscle({
	id: 64918,
	name: 'Iliopsoas',
	direction: 'Anterior',
	components: [
		Muscle.withID(18060),
		Muscle.withID(22310)
	],
	synonyms: ['Inner hip muscles','dorsal hip muscles','hip flexors'],
	displayable: false
});
muscleLookup['71302'] = new Muscle({
	id: 71302,
	name: 'Erector spinae',
	direction: 'Posterior',
	components: [
		Muscle.withID(77177),
		Muscle.withID(77178),
		Muscle.withID(77179)
	],
	synonyms: [],
	displayable: true
});
muscleLookup['10'] = new Muscle({
	id: 10,
	name: 'Lower Back',
	direction: 'Posterior',
	components: [
		Muscle.withID(71302)
	],
	synonyms: [],
	displayable: false
});
muscleLookup['37371'] = new Muscle({
	id: 37371,
	name: 'Forearms',
	direction: 'Anterior',
	components: [
		Muscle.withID(37704),
		Muscle.withID(38465),
		Muscle.withID(38485),
		Muscle.withID(38500),
		Muscle.withID(38506),
		Muscle.withID(38518),
		Muscle.withID(38521),
		Muscle.withID(38459),
		Muscle.withID(38469)
	],
	synonyms: ['Forearms'],
	displayable: false
});
muscleLookup['11'] = new Muscle({
	id: 11,
	name: 'Middle Back',
	direction: 'Posterior',
	components: [
		Muscle.withID(13379),
		Muscle.withID(32555)
	],
	synonyms: [],
	displayable: false
});
muscleLookup['12'] = new Muscle({
	id: 12,
	name: 'Abductors',
	direction: 'Posterior',
	components: [
		Muscle.withID(22317),
		Muscle.withID(22315)
	],
	synonyms: ['Abductor'],
	displayable: false
});
muscleLookup['32521'] = new Muscle({
	id: 32521,
	name: 'Deltoids',
	direction: 'Anterior',
	components: [
		Muscle.withID(83003),
		Muscle.withID(83006),
		Muscle.withID(83007)
	],
	synonyms: ['Deltoid'],
	displayable: false
});
muscleLookup['9626'] = new Muscle({
	id: 9626,
	name: 'Trapezius',
	direction: 'Posterior',
	components: [
		Muscle.withID(32555),
		Muscle.withID(32557),
		Muscle.withID(32556)
	],
	synonyms: ['Traps'],
	displayable: false
});
muscleLookup['82650'] = new Muscle({
	id: 82650,
	name: 'Rotator Cuff',
	direction: 'Posterior',
	components: [
		Muscle.withID(32546),
		Muscle.withID(32550),
		Muscle.withID(13413),
		Muscle.withID(9629)
	],
	synonyms: [],
	displayable: false
});
muscleLookup['37688'] = new Muscle({
	id: 37688,
	name: 'Triceps',
	direction: 'Posterior',
	components: [
		Muscle.withID(37692),
		Muscle.withID(37694)
	],
	synonyms: ['Triceps brachii','Tricep'],
	displayable: false
});
muscleLookup['33531'] = new Muscle({
	id: 33531,
	name: 'Shoulders',
	direction: 'Posterior',
	components: [
		Muscle.withID(32521),
		Muscle.withID(82650),
		Muscle.withID(32549)
	],
	synonyms: ['Shoulders'],
	displayable: false
});
muscleLookup['37370'] = new Muscle({
	id: 37370,
	name: 'Arm',
	direction: 'Anterior',
	components: [
		Muscle.withID(37670),
		Muscle.withID(37688),
		Muscle.withID(37371),
		Muscle.withID(33531)
	],
	synonyms: [],
	displayable: false
});
muscleLookup['85216'] = new Muscle({
	id: 85216,
	name: 'Back',
	direction: 'Posterior',
	components: [
		Muscle.withID(13357),
		Muscle.withID(13379),
		Muscle.withID(13380),
		Muscle.withID(32546),
		Muscle.withID(32549),
		Muscle.withID(32550),
		Muscle.withID(71302)
	],
	synonyms: ['General Back','Back General'],
	displayable: false
});
muscleLookup['64922'] = new Muscle({
	id: 64922,
	name: 'Glutes',
	direction: 'Posterior',
	components: [
		Muscle.withID(22314),
		Muscle.withID(22315)
	],
	synonyms: [],
	displayable: false
});
muscleLookup['22428'] = new Muscle({
	id: 22428,
	name: 'Quadriceps',
	direction: 'Anterior',
	components: [
		Muscle.withID(74998),
		Muscle.withID(22430),
		Muscle.withID(22431),
		Muscle.withID(22432)
	],
	synonyms: ['Quadriceps Femoris'],
	displayable: false
});
muscleLookup['81022'] = new Muscle({
	id: 81022,
	name: 'Hamstrings',
	direction: 'Posterior',
	components: [
		Muscle.withID(22356),
		Muscle.withID(22357),
		Muscle.withID(51048)
	],
	synonyms: [],
	displayable: false
});
muscleLookup['50208'] = new Muscle({
	id: 50208,
	name: 'Thigh',
	direction: 'Anterior',
	components: [
		Muscle.withID(22428),
		Muscle.withID(81022)
	],
	synonyms: ['Thighs'],
	displayable: false
});
muscleLookup['65004'] = new Muscle({
	id: 65004,
	name: 'Calves',
	direction: 'Posterior',
	components: [
		Muscle.withID(22538),
		Muscle.withID(22542),
		Muscle.withID(45956),
		Muscle.withID(45959)
	],
	synonyms: ['Calf'],
	displayable: false
});
muscleLookup['9622'] = new Muscle({
	id: 9622,
	name: 'Legs',
	direction: 'Anterior',
	components: [
		Muscle.withID(50208),
		Muscle.withID(65004)
	],
	synonyms: ['Leg'],
	displayable: false
});
muscleLookup['78435'] = new Muscle({
	id: 78435,
	name: 'Abdominals',
	direction: 'Anterior',
	components: [
		Muscle.withID(9628),
		Muscle.withID(13335),
		Muscle.withID(13397)
	],
	synonyms: ['Abs','Ab','Core'],
	displayable: false
});
muscleLookup['9627'] = new Muscle({
	id: 9627,
	name: 'Pectoralis Major',
	direction: 'Anterior',
	components: [
		Muscle.withID(34696),
		Muscle.withID(34687)
	],
	synonyms: [],
	displayable: false
});
muscleLookup['50223'] = new Muscle({
	id: 50223,
	name: 'Pectorals',
	direction: 'Anterior',
	components: [
		Muscle.withID(9627),
		Muscle.withID(13109)
	],
	synonyms: ['Pecs','Pectoralis','Chest'],
	displayable: false
});

return Muscle;

})(d3);
