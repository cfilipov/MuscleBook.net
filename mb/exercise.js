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

mb.Exercise = class {
	muscles() {
		return this.muscleMovements.map(m => mb.Muscle.withID(m.fmaID));
	}

	displayableMuscleIDs() {
		const mids = this.muscles().map(m => m.displayableComponents().map(m => m.id));
		const umids = [].concat.apply([], mids);
		return [...(new Set(umids))];
	}
}
