// KULTURA Meta search
// (c) 2011 user:zocky @ wiki.ljudmila.org
// GPL 3.0 applies
//
// client application

/* expects results in the format:
{
	source: {
		id, 
		name, 
		home 
	},
	results: [{	
		url, 
		title, 
		description, 
		image 
	}, ... ]
}
*/

jQuery.jQueryRandom = 0;
jQuery.extend(jQuery.expr[":"],
{
    random: function(a, i, m, r) {
        if (i == 0) {
            jQuery.jQueryRandom = Math.floor(Math.random() * r.length);
        };
        return i == jQuery.jQueryRandom;
    }
});

var CLIENT = (function() {
	function urlencode (str) {
		str = (str + '').toString();
		return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
		replace(/\)/g, '%29').replace(/[*]/g, '%2A').replace(/%20/g, '+');
	}
	function urldecode (str) {
		return decodeURIComponent((str + '').replace(/\+/g, '%20'));
	}
	function gup (name) {
		name = name.replace('[','\\[').replace(']','\\]');
		var regex = new RegExp('[\\?&]'+name+'=([^&#]*)(&|$)');
		var results = regex.exec( window.location.href );
		return results === null ? '' : urldecode(results[1]);
	}
	function shorten(str,len) {
		str = str || '';
		return str.length>len ? str.substr(0,len-1)+'…' : str;
	}
	function makeResult (src, res) {
		var title = shorten(res.title,40- (res.image ? 5 : 0));
		var description = shorten(res.description,200);
		return $(
			'<div id="def-'+src.id+'" class="result '+res.type+'">'
		+		'<div class="source"><a href="'+src.home+'">'+src.name+'</a></div>'
		+	(res.image ? '<a href="'+res.url+'"><img class="image" title="'+res.title+'" src="'+res.image+'"></a>' : '')
		+		'<div class="title"><a href="'+res.url+'" title="'+res.title+'">'+title+'</a></div>'
		+		'<div class="description" title="'+res.description+'">'+description+'</a></div>'
		+		'<div class="url"><a href="'+res.url+'">'+res.url+'</a></div>'
		+	'</div>'
		);
	}
	var addResultByType = {
		_: function (src,res) {
			var $res = makeResult(src,res);
			$('#'+res.type).append($res);
			$('#heading-'+res.type).add('#'+res.type).css('display','block');
			return $res;
		},
		image: function (src,res) {
			var $res = makeResult(src,res);
			$images = $('#image .result');
			if ($images.length == 0) {
				$('#heading-'+res.type).add('#'+res.type).css('display','block');
				$('#image').append($res);
			} else {
				$images.eq((Math.random()*$images.length)|0).after($res);
			}
		},
		data: function(src,res) {
			$('#heading-data, #data').css('display','block');
			if (!$('#data-'+src.id).length) {
				$('#data').append(
					'<div id="data-'+src.id+'" class="datasource">'
				+		'<div class="source"><a href="'+src.home+'">'+src.name+'</a></div>'
				+		'<div class="scroll"></div>'
				+	'</div>'
				);
			}
			$('#data-'+src.id+' > .scroll').append(makeResult(src,res));
		}
	}
	

	// TODO: facetted filtering of results
	// option 1: implement hashing of results by type and source
	// option 2: encode this information in DOM and use CSS/whatever to filter results
	
	var ret = {
		q: '',
		socket: null,
		types: {},
		sources: {}
	};
	function addResult(src,res) {
		ret.types[res.type] = ret.types[res.type] || [];
		ret.types[res.type].push(res);
		ret.sources[src.id] = ret.sources[src.id] || [];
		ret.sources[src.id].push(res);
		(addResultByType[ res.type ] || addResultByType._) ( src , res );
	}
	var haveSearched = false;
	function setup () {
		var socket = io.connect(location.host);
		var q = gup('q');
		$('#q').val(q);
		socket.on('welcome', function (data) {
			console && console.log('welcome!');
			if (haveSearched) return;
			haveSearched = true;
			if (q) {
				$('#q').addClass('spinner');
			  	socket.emit('search', {
			  		q: q
			  	});
		  	}
		});
		socket.on('results', function (data) {
			for (var i in data.results) {
				addResult(data.source,data.results[i]);
			}
		});
		socket.on('endresults', function (data) {
			$('#q').removeClass('spinner');
		});
		ret.q = q;
		ret.socket = socket;
	}	
	$(setup);
	return ret;
})();
