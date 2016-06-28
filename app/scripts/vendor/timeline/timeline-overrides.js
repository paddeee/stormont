/* Override timeline.js so don't need to change library file */

TL.ajax = function() {};
TL.getJSON = function() {};

// Override unique key functionality as it causes issues when we have to leave a last event in in the timeline when
// clearing the timeLine.
TL.Util.ensureUniqueKey = function(obj, candidate) {
  return candidate;
};

/* Overrides to add classes that can be used to style the timeline evdents depending on category */
TL.Media.DailyMotion = TL.Media.extend({

  _loadMedia: function() {
    this._el.content_item	= TL.Dom.create("div", "tl-media-dailymotion", this._el.content);
  }
});

TL.Media.Flickr = TL.Media.extend({

  _loadMedia: function() {
    this._el.content_item = TL.Dom.create("div", "tl-media-flickr", this._el.content);
  }
});

TL.Media.Twitter = TL.Media.extend({

  _loadMedia: function() {
    this._el.content_item = TL.Dom.create("div", "tl-media-twitter", this._el.content);
  }
});

TL.Media.Wikipedia = TL.Media.extend({

  _loadMedia: function() {
    this._el.content_item	= TL.Dom.create("div", "tl-media-wikipedia", this._el.content);
  }
});

TL.Media.Vimeo = TL.Media.extend({

  _loadMedia: function() {
    this._el.content_item	= TL.Dom.create("div", "tl-media-vimeo", this._el.content);
  }
});

TL.Media.Vine = TL.Media.extend({

  _loadMedia: function() {

    // Create Dom element
    this._el.content_item	= TL.Dom.create("div", "tl-media-vine", this._el.content);
  }
});

TL.Media.SoundCloud = TL.Media.extend({

  _loadMedia: function() {

    this._el.content_item	= TL.Dom.create("div", "tl-media-soundcloud", this._el.content);
  }
});

TL.Media.GooglePlus = TL.Media.extend({

  _loadMedia: function() {

    // Create Dom element
    this._el.content_item	= TL.Dom.create("div", "tl-media-googleplus", this._el.content);
  }
});

TL.Media.DocumentCloud = TL.Media.extend({

  _loadMedia: function() {

    this._el.content_item	= TL.Dom.create("div", "tl-media-documentcloud", this._el.content);
  }
});
