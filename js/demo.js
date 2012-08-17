/*  
 *  Declare standard objects for the API (model/view)
 */
var sp = getSpotifyApi(1);
var m = sp.require('sp://import/scripts/api/models');
var v = sp.require('sp://import/scripts/api/views');
var dom = sp.require('sp://import/scripts/dom');

var API_KEY = "change_me"; // Personal key obtained from Last.FM
var API_REQ = "http://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&format=json&api_key=" + API_KEY;

var application = (function() {
	var artists, limit, tracks;
	/* Initialize app on body.onload */
	init = function() {
		addLoader();
		fetchLastFMData();
	},
	addLoader = function() {
		var loaderHtml = '<div class="throbber"><div class="wheel"></div></div>';
		$('.app').before(loaderHtml);
	},
	/* Make a call to API, fetching data for json */
	fetchLastFMData = function() {
		// Lets do a XMlHttpRequest and fetch some data
		var jqxhr = $.getJSON(API_REQ, function(data) { })
					.success(function(data) { buildListOfArtists(data); }) /* Depreciation for this, but still.. */
					.error(function(data) { })
					.complete(function(data) { });
	},
	/* Creates a list of artists to feed the player */
	buildListOfArtists = function(data) {
		artists = [];
		limit = 10;

		for(var i = 0; i < limit; ++i)
		{
			// Create a new artist object and set data
			var artist = new Artist();
			artist.name = data.artists.artist[i].name;
			artists.push(artist);
		}
		searchSpotifyForArtists();
	},
	Artist = function(name) {
		this.name = name;
	},
	searchSpotifyForArtists = function() {
		tracks = [];
		for(var i = 0; i < artists.length; ++i)
		{
			var artist = artists[i];
			// Start with a search
			var search = new m.Search("artist:"+artist.name);
			search.observe(m.EVENT.CHANGE, function() {
				var uris = search.tracks.slice(0);
				// Push returned uri's into a holder for further use
				tracks.push(uris);
			});
			search.appendNext();
		}
		// Remove loading indicator
		var loader = dom.queryOne('.throbber');
		dom.destroy(loader);
		// Searching is done, lets create some playlists!
		addPlayersToApp();
	},
	addPlayersToApp = function() {
		for(var i = 0; i < artists.length; ++i)
		{
			// Create element for visual holder and set class (for css)
			var playerHolder = $(document.createElement('div'));
			playerHolder.addClass('player');
			// Create title and enumeraion
			var title = $(document.createElement('span'));
			var pos = "#" + (i + 1);
			// Set class (for css)
			title.addClass("title");
			title.text(pos + ": " + artists[i].name);
			// Add text to holder
			playerHolder.append(title);
			// Create spotify objects
			var playlist = new m.Playlist();
			var player = new v.Player();
			// Fill up playlist
			playlist.add(tracks[i]);
			// Set context
			player.context = playlist;
			// Set 1st track to player
			player.track = playlist.get(0);
			// Add it to dom
   			playerHolder.append(player.node);
   			$('.app').append(playerHolder);
   			// Visual list
   			var list = new v.List(playlist, function(track) {
				return new v.Track(track, v.Track.FIELD.STAR | v.Track.FIELD.POPULARTIY | v.Track.FIELD.ARTIST | v.Track.FIELD.NAME | v.Track.FIELD.DURATION );
			});
			// Add list below player
   			playerHolder.append(list.node);
		}
	};
})();