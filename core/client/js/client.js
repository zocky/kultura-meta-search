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
		name, 
		description, 
		image 
	}, ... ]
}
*/

var CLIENT = (function() {
	var ret = {
		q: '',
		socket: null,
		types: {},
		sources: {}
	};
   var $selectedClone=$('<div></div>');
	var $body;
   
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
		var results = regex.exec( window.location.href.replace(/#.*$/,''));
		return results === null ? '' : urldecode(results[1]);
	}
	function shorten(str,len) {
		str = str || '';
		return str.length>len ? str.substr(0,len-1)+'…' : str;
	}

	function switchListToDetail() {
		var d=300;
		if($body.hasClass('mode-detail')) return;

		var $cont = $('#results-wrap');
		var $detail = $('#detail');
		var $wrap =  $('#detail-wrap');
		var scroll = $('#results-scroll').get(0);
		var o = $selected.offset();
		var l = o.left;

		$wrap.css({display:'block',zIndex:10});
		$detail.css({ left: l-10, background:'grey'});
		setTimeout(function() {
			$detail.animate({ left: 0 }, d, 'linear', function() {
	  			$wrap.css({zIndex:0});
			});
			$cont.animate({	left: 10-l },d, 'linear', function() {
				$cont.css({left:0});
				// switch modes
				$body.removeClass('mode-list');
				$body.addClass('mode-detail');
				scroll.scrollLeft = 0;
				// restore selected result position
				scroll.scrollTop += $selected.offset().top - o.top;
				fixSelection();
			});
		},50);
	}

	function switchDetailToList() {
		var d=500;
		if($body.hasClass('mode-list')) return;

		$selectedGhost && $selectedGhost.css('display','none');
		$body.removeClass('mode-initial mode-detail');
		$body.addClass('mode-list');
		delete location.hash;
		if(!$selected) return;

		var $cont = $('#results-wrap');
		var scroll = $('#results-scroll').get(0);
		var $detail = $('#detail');
		var $wrap = $('#detail-wrap');
		$wrap.css({	zIndex: 10,	display: 'block'});
		var l = $selected.offset().left;
		scroll.scrollLeft = l - $cont.width()/2 + 110;
		var l = $selected.offset().left;
		var L = scroll.scrollLeft;
		$cont.css({	left: -l})
		.animate({ left: 0 }, {
			duration:d*l/$cont.width(),
			easing: 'linear',
		});
		$detail.animate({
			left: $cont.width()
		},{
			complete: function() {
				$wrap.css({	zIndex: 0,	display: 'none'});
				$detail.attr('src','about:blank');
			},
			duration: d,
			easing: 'linear',
		});
	}


	var $selected;
	var $selectedGhost;
	
	function select($res) {
		$selected && $selected.removeClass('selected');
		$res.addClass('selected');
		$selected = $res;
		$selectedGhost && $selectedGhost.remove();
		$selectedGhost = $res
		.clone()
		.removeClass('selected')
		.addClass('ghost')
		.appendTo('#results');
		fixSelection();
		setTimeout(function() {
			$selectedGhost.addClass('selected');
		},0)
	}
	function fixSelection() {
		if ($selected) {
			var $scroll = $('#results-scroll');
			var scroll = $scroll.get(0);
			var selected = $selected.get(0);
			var h = $selected.height();
			var t = selected.offsetTop;
			var b = t + h;
	 		var T = scroll.scrollTop;
	 		var B = T + $scroll.height();
	 		
			if (t<T) $selectedGhost.css({
				display:'block',
				top:T,
			}); else if (b > B) $selectedGhost.css({
				display:'block',
				top: B-h
			}); else $selectedGhost.css({
				display:'block',
				top: t
			});
		}
	}
	var go = function (e) {
		//$('#spinner').addClass('loading');
		var $this = $(this);
		var $res = $this.closest('.result');
		select($res);
		switchListToDetail();
		location.hash = $res.attr('id'); // - not workign in webkit
		//location.href = location.href.replace('#.*','#'+$res.attr('id'));
	}

	function addSource(src,search,meta) {
		$('#results-header nav').append(' <a class="jumpToSource" href="#datasource-'+src.id+'">'+src.name+'</a> ');
		return $(
			'<section id="datasource-'+src.id+'" class="datasource">'
		+  	'<header class="datasource-header">'
		+			'<h3>'
		+				'<a class="datasource-url" target="detail" href="'+search+'" title="Rezultati na: '+src.name+'">'
		+					'<img class="datasource-icon" src="'+meta.shortcutIcon+'" alt="'+src.name+'" onerror="$(this).remove()">' //TODO: get correct favicon from scraper!
		+				'</a>'
		+				'<a class="datasource-searchurl" target="detail" href="'+search+'" title="Rezultati na: '+src.name+'">'+src.name+'</a>'
		+			'</h3>'
		+		'</header>'
		+	'</section>'
		)
		.appendTo('#results');
	}
	function addResult(src,res,search,meta) {
		var name = shorten(res.name||res.title,60); //TODO: fix scrapers to return name, NOT title
		var description = shorten(res.description,130);
		var id = (src.name+' '+name);
		
		var properties = '';//TODO: add semantic properties
		
		var $res = $(
			'<div id="'+id+'" class="result '+res.type+'">'
		+		'<figure>'
		+	(res.image ? '<a class="image" target="detail" href="'+res.url+'"><img onerror="$(this).remove()" alt="'+res.name+'" src="'+res.image+'"></a>' : '')
		+		'</figure>'
		+		'<header>'
		+			'<div class="source"><a href="'+src.home+'">'+src.name+'</a></div>'
		+			'<div class="type">'+res.type+'</div>'
		+			'<h4 class="name"><a target="detail" href="'+res.url+'">'+name+'</a></h4>'
		+		'</header>'
		+		'<content>'
		+	(res.description ? '<div class="description" name="'+res.description+'">'+description+'</a></div>' : '')
		+		properties
		+		'</content>'
		+		'<footer>'
		+			'<div class="url"><a href="'+res.url+'">'+res.url+'</a></div>'
		+		'</footer>'
		+	'</div>'
		);
		$res.find('a[target=detail]').click(go);
		if (res.type == 'image') {
			$('#images').append($res);
		} else {
			var $datasource = $('#datasource-'+src.id);
			if ($datasource.length == 0) {
				$datasource = addSource(src,search,meta);
				$datasource.find('.datasource-header').append($res);
			} else {
				$datasource.append($res);
			}
		}
	}
	function fixProgress(n) {
		$('#progress').css('width',Math.round(n*100)+'%');
	}
	var haveSearched = false;
	function setup () {
    	$body = $('body');
		$('body').addClass('mode-initial');
		var socket = io.connect(location.host);
		var q = gup('q');
		$('#q').val(q);
		var total;
		var progress;
		socket.on('welcome', function (data) {
			console && console.log('welcome!');
			if (q) {
				if (haveSearched) return;
				haveSearched = true;
				switchDetailToList();
				$('#q').addClass('spinner');
			  	socket.emit('search', {
			  		q: q
			  	});
			  	total = 0;
			  	progress = 0;
				fixProgress(0);
		  	}
		});
		socket.on('searchstarted', function (data) {
			total = data.sourcecount+1;
			progress ++;
			fixProgress(progress/total);
		});
		function doAddResult(data,i) {
			if (i>=data.results.length) return;
			addResult(data.source,data.results[i],data.search,data.meta);
			setTimeout(function() {
				doAddResult(data,i+1);
			},10);
		}
		socket.on('results', function (data) {
			doAddResult(data,0);
			progress ++;
			fixProgress(progress/total);
		});
		socket.on('error', function (data) {
			progress ++;
			fixProgress(progress/total);
		});
		socket.on('endresults', function (data) {
			$('#q').removeClass('spinner');
			fixProgress(1);
			progress = 0;
			total = 0;
			setTimeout( function() {
				fixProgress(0)
			}, 250);
		});
		ret.q = q;
		ret.socket = socket;
		
	   $('#images-scroll')
      	.bind('mousewheel', function(event, delta) {
      	this.scrollLeft -= delta * 120;
      })
        //TODO: set this on view mode change, avoid checking class on each mouse wheel event
	   $('body.mode-list #results-scroll').live('mousewheel',function(e,delta) {
	    	e.preventDefault();
    		this.scrollLeft -= delta * 120;
	   });
	   $('body.mode-detail #results-scroll').live('mousewheel',function(e,delta) {
	    	e.preventDefault();
    		this.scrollTop -= delta * 60;
    		fixSelection();
	   });
		$('#submit').click(function(e) {
			if($('#q').val()==gup('q')) {
				e.preventDefault();
				switchDetailToList();
			}
		});
	}
	$(setup);
	return ret;
})();
