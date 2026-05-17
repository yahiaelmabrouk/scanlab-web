// Git merge driver to automatically resolve json merge conflicts
// from:
//    https://gist.github.com/jphaas/ad7823b3469aac112a52
//    http://blog.joshhaas.com/2014/06/how-to-merge-json-files-using-git/

// To install:

// In your git configuration (for instance, .git/config to do it at the project level), add:

// [merge "json-merge"]
// 	name = A custom merge driver for json files
// 	driver = node json-merge.js %O %A %B
// 	recursive = binary

// In your project's .gitattributes file, add something like:

// *.json merge=json-merge

let ancestor, conflicts, fs, make_conflict_node, merge, ours, theirs

fs = require('fs')

// Read in and parse the files
ancestor = JSON.parse(fs.readFileSync(process.argv[2]))

ours = JSON.parse(fs.readFileSync(process.argv[3]))

theirs = JSON.parse(fs.readFileSync(process.argv[4]))

// This gets set to true if we find a conflict
conflicts = false

// Generate a node to indicate a conflict
// We include '<<<<<<<<>>>>>>>>' so that developers used to searching for <<<<
// to find conflicts can maintain their current habits
make_conflict_node = function (ancestor_value, our_value, their_value, path) {
  let res
  res = {}
  res['CONFLICT'] = '<<<<<<<<>>>>>>>>'
  res['OURS'] = our_value != null ? our_value : null
  res['THEIRS'] = their_value != null ? their_value : null
  res['ANCESTOR'] = ancestor_value != null ? ancestor_value : null
  res['PATH'] = path.join('.')
  return res
}

// The main merge function; we call it with the 3 json objects, and then
// it recursively calls itself.  It modifies our_node with the result
// of the merge.

// Path is an array of key names indicating where we are in the object
merge = function (ancestor_node, our_node, their_node, path = []) {
  // eslint-disable-next-line no-unused-vars
  let _, ancestor_value, key, keys, our_value, results, sub_path, their_value

  // Create a set of all the keys present in either our node or their node
  keys = {}
  for (key in our_node) {
    _ = our_node[key]
    keys[key] = true
  }
  for (key in their_node) {
    _ = their_node[key]
    keys[key] = true
  }

  // Go through each key...
  results = []
  for (key in keys) {
    // eslint-disable-next-line no-unused-vars
    _ = keys[key]
    // Get the values at that key for the three objects
    ancestor_value = ancestor_node != null ? ancestor_node[key] : void 0
    our_value = our_node != null ? our_node[key] : void 0
    their_value = their_node != null ? their_node[key] : void 0
    sub_path = path.concat(key)

    // If there's a discrepency...
    if (our_value !== their_value) {
      // if theirs matches the ancestor, go with ours
      if (JSON.stringify(their_value) === JSON.stringify(ancestor_value)) {
        // no action is needed in this case
        continue

        // if ours matches the ancestor, go with theirs
      } else if (JSON.stringify(our_value) === JSON.stringify(ancestor_value)) {
        // We write the value to our_node since we're going to overwrite
        // our version with the merged version
        results.push((our_node[key] = their_value))

        // if both ours and theirs are objects, recurse into them
      } else if (our_value && their_value && typeof our_value === 'object' && typeof their_value === 'object') {
        results.push(merge(ancestor_value, our_value, their_value, sub_path))
      } else {
        // finally, if none of the above are true, report a conflict
        conflicts = true
        results.push((our_node[key] = make_conflict_node(ancestor_value, our_value, their_value, sub_path)))
      }
    } else {
      results.push(void 0)
    }
  }
  return results
}

// Kick off the merge on the top of the json tree
// Merge modifies ours.
merge(ancestor, ours, theirs)

// We write the merged version of ours back to the file we got it from, which
// is what git expects us to do with the results of the merge.

// We tell JSON.stringify to pretty-print it with 2 spaces per tab.
fs.writeFileSync(process.argv[3], JSON.stringify(ours, null, 2) + '\n')

// If there were conflicts, we exit with an error code of 1 to tell git that
// the conflicts need manual resolution.
// Otherwise, we exit with a code of 0 to tell git that the merge was successful.
process.exit(conflicts ? 1 : 0)
