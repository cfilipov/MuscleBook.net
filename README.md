# Muscle Book *(web)*

[![License MIT](https://img.shields.io/badge/License-AGPL-blue.svg?style=flat)](https://www.gnu.org/licenses/agpl-3.0-standalone.html)

<a href="https://d3js.org"><img src="Icon512.png" align="left" hspace="10" vspace="6" width="55px"></a>

[MuscleBook.net](http://musclebook.net) is a web app for analyzing and logging strength training and body building data. MuscleBook has no server and works completely offline using [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). Muscle Book aims to present workout data in a way that highlights and encourages [progressive overload](https://en.wikipedia.org/wiki/Progressive_overload) and long term commitment. There are many workout tracking apps already available, what sets this one apart is the focus on data. If you want a workout app that guides you through a routine this isn't the tool for you. On the other hand, if you manage the routine yourself and track your workouts in a spreadsheet with a bunch of formulas and charts, you're probably the kind of person who would like this app.

**[Demo](http://musclebook.net?data=sample-data.json) with sample data.**

## Browser Support

Muscle Book has been tested to work on the following browsers:

* Google Chrome 53
* Safari 10.0
* Mobile Safari, iOS 10

I'm not interested in trying to support every possible browser, especially the older ones. Muscle Book requires a fairly modern browser, specifically, one that supports the following:

* [ECMA 2015 (ES6)](https://kangax.github.io/compat-table/es6/)
* [IndexedDB](http://caniuse.com/#feat=indexeddb)*
* [SVG](http://caniuse.com/#feat=svg)

Muscle Book relies heavily on Javascript. If you have Javascript disabled, it simply won't work.

\*<small>*Versions of Safari before 10.x "support" IndexedDB but there are serious issues. This means you need Safari 10.0 or newer.*
</small>

## Warning

Always backup your data! Data is stored locally in the browser, not sent to the cloud. It's up to you to frequently export and backup your data in case something goes wrong.

## Privacy

A top priority of this project is to maintain all offline support for all key features. Everything is done client-side, including data storage and calculations. Some future features may require network connectivity, such as syncing with Dropbox or sharing dashboards, but those are things you have to explictely opt into. You own your data, you decide how it's used, you control where it gets sent.

## Features

- Simple workout data entry supporting reps, sets, weight, duration, warmup and failure sets
- Musculature visualizations
- Intensity and volume calculations
- Import from CSV
- Export to JSON
- Track and visualize personal records (PRs)
- Exercise search
- Github-style punchcard graph
- Supports multiple workouts per day
- Proper time zone support (important for people who travel)
- Works offline, *no network connection required*
- Lots of charts

## Non-Goals

Muscle Book aims to be a useful tool for all lifters regardless of routine, lifting style or goal. To that end, here is a list of functionality that is intentionally excluded from the scope of the project:

1. Workout planning
2. Suggestions or coaching
3. Routine-specific features
4. Anything that requires a centralized server
5. Non-strength or muscle related features (running, etc...)
6. Weight/exercise Goals

## Changes

A list of changes can be found in the [CHANGELOG](CHANGELOG.md).

## Contributing

Contributions are very welcome. You don't need to know how to program to contribute to this project.

All contributors must sign the contributor license agreement ([CLA](CLA.md)) before their pull request can be merged. Check out the [Contributions](CONTRIBUTING.md) page for more details.

## License

Copyright (C) 2016  Cristian Filipov

MuscleBook is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

MuscleBook is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

A full copy of the GNU Affero General Public License is available in the included [LICENSE](LICENSE.md) file.
