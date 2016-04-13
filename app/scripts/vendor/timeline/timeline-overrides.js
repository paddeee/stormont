/* Override timeline.js so don't need to change library file */

TL.ajax = function() {};
TL.getJSON = function() {};

// Override unique key functionality as it causes issues when we have to leave a last event in in the timeline when
// clearing the timeLine.
TL.Util.ensureUniqueKey = function(obj, candidate) {
  return candidate;
};
