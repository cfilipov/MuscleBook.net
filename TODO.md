# TODO

## Priority

1. ‼️ Top Priority
2. ⚠️ Bug
3. ❗️ High Priority
4. ❕ Low Priority
5. 💡 Idea, No Plans
6. ❔ Should this even be done?

## Items

* [ ] ❗️ Don't use grey for ordinal colors (because charts use it to show deselected rows)
* [ ] ⚠️ Row chart selected rows not changing opacity.
* [ ] ⚠️ Firefox not loading
* [x] ~~❗️ Move all calculations into inner dictionary~~
* [x] ~~⚠️ Seconds saved as seconds / 1000~~
* [x] ~~⚠️ License text not scrolling~~
* [ ] ⚠️ No tool tip on anatomy diagrams with no data
* [x] ~~⚠️ Entry id property missing on new entries~~
* [x] ~~⚠️ Low volume workouts get completely filtered out of calendar graph~~
* [x] ~~⚠️ iOS overscroll looks like shit in web clip~~
* [x] ~~❗️ Link to GutHub project~~
* [ ] ❔ Faster re-calculations by using PR table
* [ ] ❗️ Define volume and intensity for duration-based workouts (planks)
* [ ] ❗️ Exit demo option when clicking "DEMO" indicator
	* Reload the page w/o `?demo` param
* [ ] ❕ Query string chart state
	* Query string fucks up app cache, use fragment identifier instead
* [ ] ❕ Add more bodyweight and only ring exercises to exercise lookup
* [x] ~~‼️ Debug mode indicator~~
	* [x] ~~Url param `debug` to enable~~
	* [ ] Make debug actions visible only on debug mode
* [ ] ❔ User-defined exercises
	* This brings up a lot of issues with consistency when sharing data
* [ ] ❕ Ability to delete entries
* [ ] ❕ Ability to insert past entries
* [ ] Raw data browser
* [ ] ❕ Credits modal in about screen
    * [x] ~~Credit libs, contributors & artists~~
* [ ] ❕ Muscle browser
	* [ ] ❕ Anatomy diagram
	* [ ] ❕ Display muscle groups and components
	* [ ] Link to wikipedia
* [ ] Initial state
    * [ ] ‼️ Panning time chart with no data goes the wrong way
    * [ ] ❗️ Charts should show "No Data" indicator or something
    * [ ] ❕ Loading indicators
    * [ ] ❗️ Pre-set size for chart placeholders while they load
    * [ ] ❗️ "Javascript required" fallback text
* [ ] 💡Search field in main nav bar
	* [ ] 💡Fuzzy search anything
		* Exercise name
		* Muscle name
		* Muscle role
		* Mechanics
		* Date/time of workout/entry
* [ ] ‼️ General UI glitches/improvements
	* [ ] ⚠️ Fix rounded corners on card header items
	* [ ] ⚠️ Fix white square corners on last rows in card
    * [ ] ❗️ Cleaner shapes that align with paths in anatomy svgs
        * [x] ~~❗️ Revert to thin lines for paths~~
    * [x] ~~❗️ Empty charts have very thick axis lines~~
        * On some browsers? On mobile? On certain sizes?
    * [ ] ❗️ Better start/stop icons on stopwatch (use noun project).
    * [ ] 💡❔ Bigger brush handles on mobile?
        * [ ] ❕ Or better yet, disable drag-to-select-range
* [ ] ❕ Settings
	* [ ] Make duration optional
	* [ ] Remember selected metric
	* [ ] Store data as kg? convert to desired (default local) unit
* [ ] New Set Modal
	* [ ] ❔ Notes field
	* [x] ~~❗️ Better name: "Add Set"~~
	* [ ] ❗️ Show e1rm, 1rm, max weight prs
	* [ ] ❗️ Reps, sets, weight graph
	* [ ] ❗️ PR alert box on pr
	* [ ] ‼️ Better input validation
		* [ ] ‼️ Check for stopwatch completion
		* [ ] ❗️ Check for really high reps (>100?)
	* [ ] ❕ Show last set performed for selected exercise
	* [ ] ❗️ Opening another modal while on this one should not reset state
* [ ] ❗️ Exercise selector
	* [ ] ❕ Fuzzy search
	* [ ] ❕ Filter selector: equipment, force, mechanics, muscle/role
	* [ ] ❗️ Sort toggle: Alphabetical, Frequency
		* [ ] ‼️ Sort by frequency by default (filter out unused workouts)
			* Unless no workouts have ever been performed
* [ ] ‼️ Exercise detail modal
	* [ ] ⚠️ Fix linking to exercise detail
	* [ ] Link to youtube videos
	* [ ] ⚠️ Fix moreURLs in exercise lookup data
* [ ] ❗️ Workout detail modal
	* [ ] ❕ Total volume per workout (all exercises)
* [ ] ‼️ Demo Mode
	* [ ] ❗️ Static "today" date from url param
	* [x] ~~❗️ "DEMO" banner~~
    * [ ] ❔ Reset everything
    * [ ] ❗️ Exit demo mode button
    * [x] ~~‼️ Don't touch DB when in demo mode~~
* [ ] ❕ Stats
	* Modal? Another item on dashboard?
	* [ ] ❕ Total workouts count
	* [ ] ❕ "Big 3" total
	* [ ] ❕ Average days between workouts
	* [ ] ❕ Other stats from mb.app
* [ ] Dashboard
    * [ ] ❕ Exponential data axis (clearer differences)
    * [ ] ❕ Number of days since last workout/last rest day
        * ❕ Use red alert if it's been a while
	* [x] ~~❗️ Workout list (third column)~~
        * [ ] ❔ Expand to show entries
        * ❔ Hide on mobile
	* [x] ~~❗️ Move muscle filter to drop-down on anatomy box~~
		* [ ] ❗️ Make muscle filter actually work
	* [x] ~~❗️ Change metric selection to row of buttons~~
	* [x] ~~❗️ Allow selecting multiple metrics (use max of each)~~
    * [x] ~~‼️ Clamp column size to md or lg on xl (to make room for 3rd col)~~
    * [ ] ❗️ "Expand/Collapse" button on muscle & exercise bar charts to show more than just 10 items
    * [ ] ❗️ Active vs Rest time pie chart
    * [ ] ❗️ Push vs pull pie chart
    * [ ] 💡❔ Collapse/hide chart containers?
    * [ ] 💡 Selecting item in timeline chart shows workout details?
        * ❔ Modal or show chart under
        * ❔ Or even swap our group and show entries in the chart. Basically, zoom into the level of workout, zoom back out to day-by-day view
* [ ] Export
	* [ ] ‼️ Export to CSV
	* [ ] ❗️ Modal when exporting, select JSON or CSV
	* [x] ~~‼️ Remove data fixups from CSV import~~
* [ ] Import
    * [ ] ❕ Fuzzy match exercise
    * [ ] ❔ Show data to be imported
    * [ ] ❗️ Document CSV fields, using CSV to sync
    * [ ] Import from URL
	* [x] ~~❗️ Import JSON (recalculate if needed)~~
	* [ ] ❗️ Import from CSV (and recalculate automatically)
	* [ ] ‼️ Handle new data vs fresh import
	* [ ] ‼️ Support end time, calculate duration based on this
	* [ ] ⚠️ No padding on the bottom of import progress subtitle
	* [ ] ⚠️ Import error does not result in friendly message
		* progress updater can't find progress bar to remove so nothing happens.
	* [ ] Explanation text on import modal
		* What can be imported, file types, link to details... etc.
* [ ] ❕ Sharing
    * [ ] ❕ Share button (requires dropbox)
    * [ ] ❕ Read-only mode when viewing shared data
* [ ] ❗️ Dropbox sync using dropbox.js
* 💡❔ Track soreness
* 💡❔ Track body dimensions
* [ ] When there is a workout but no duration data, mark the calendar graph cell anyway to contrast with cells where there was no workout at all. perhaps use a shade lighter than the lightest color scale?
* [ ] 
