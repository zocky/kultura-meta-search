// KULTURA info search
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
   	var escapeRegExp = function(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	}	
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
	function fixColumns() {
		return;
		var c = 0;
		var $scroll = $('#results-scroll');
		var h = $scroll.height()-10;
		var t = $scroll.offset().top;
		var $results = $('#results .result');
		if(!$results.length) return;
		var l = $results.eq(0).offset().left;
		$results.css('margin-top',0);
		$results.each(function(n) {
			var $this = $(this);
			var o = $this.offset();
			if (l < o.left) {
				l = o.left;
				var o = $results.eq(n-1).offset();
				var b = h + t - (o.top + $results.eq(n-1).height());
				var m = b % (c-1);
				var d = (b - m) / (c-1);
				for (var i=1; i<c; i++) {
					$results.eq(n-i).css('margin-top', 0+d+(i<=m));
				}
				c=0;
			} else {
				c++;
			}
		});
	}
	$(window).resize(fixColumns);
	function showDetail(url) {
		var d=300;
		if($body.hasClass('mode-detail')) {
			$('#detail')[0].src = url;
			return;
		}

		var $cont = $('#results-wrap');
		var $detail = $('#detail');
		var $wrap =  $('#detail-wrap');
		var scroll = $('#results-scroll').get(0);
		var o = $selected.offset();
		var l = o.left;

		$wrap.css({display:'block',zIndex:10});
		$detail.css({ left: l-10});
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
				$('#detail')[0].src = url;
			});
		},50);
	}

	function switchDetailToList() {
		var d=500;
		if($body.hasClass('mode-list')) return;

		$selectedGhost && $selectedGhost.css('display','none');
		$body.removeClass('mode-initial mode-detail');
		$body.addClass('mode-list');
		fixColumns();
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
		e.preventDefault();
		var $this = $(this);
		var $res = $this.closest('.result');
		var url = $res.find('.url a').attr('href');
		console.log(url);
		select($res);
		showDetail(url);
		//location.hash = $res.attr('id'); // - not workign in webkit
		//location.href = location.href.replace('#.*','#'+$('#'+$res.attr('id')+' a:first').attr('href'));
	}

	function addSource(src,search,info) {
		$('#results-header nav').append(' <a class="jumpToSource" href="#datasource-'+src.id+'">'+src.shorter+'</a> ');
		return $(
			'<section id="datasource-'+src.id+'" class="datasource">'
		+  	'<header class="datasource-header">'
		+			'<h3>'
		+				'<a class="datasource-url" target="kulturec-detail" href="'+search+'" title="Rezultati na: '+src.name+'">'
		+					'<img class="datasource-icon" src="'+info.icon+'" alt="'+src.name+'" onerror="$(this).remove()">' //TODO: get correct favicon from scraper!
		+				'</a>'
		+				'<a class="datasource-searchurl" target="kulturec-detail" href="'+search+'" title="Rezultati na: '+src.name+'">'+src.name+'</a>' 
		+				( info.total ? ' <small>(' + info.total + ')</small>' : '' )
		+			'</h3>'
		+		'</header>'
		+	'</section>'
		)
		.appendTo('#results');
	}
	function addResult(src,res,search,info) {
		var name = shorten(res.name||res.title,60); //TODO: fix scrapers to return name, NOT title
		
		var description = shorten(res.description,130);
		var q = gup('q').split(/[-[\]{}()*+?.,\\^$|#\s]+/);
		for (var i in q) {
			var re= new RegExp('([^ ]*'+q[i]+'[^ ]*)','gi');
			console.log('find',q[i],'re',re);
			description = description.replace(re,'<b>$1</b>');
		}
		
		var id = (src.name+' '+name);
		
		var properties = '';//TODO: add semantic properties
		
		var $res = $(
			'<div id="'+id+'" class="result '+res.type+'">'
		+		'<figure>'
		+	(res.image ? '<a class="image" target="kulturec-detail" href="'+res.url+'"><img onerror="$(this).remove()" alt="'+res.name+'" src="'+res.image+'"></a>' : '')
		+		'</figure>'
		+		'<header>'
		+			'<div class="source"><a href="'+src.home+'">'+src.name+'</a></div>'
		+			'<div class="type">'+res.type+'</div>'
		+			'<h4 class="name"><a target="kulturec-detail" href="'+res.url+'">'+name+'</a></h4>'
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
		var $img = $res.find('.image img');
		$img
		.bind('error', function() {
			$img.remove();
		})
		.bind('load',function() {
			if(res.type=='image') return;
			if (this.naturalWidth<this.naturalHeight) $img.css({width:60});
			else $img.css({height:60});
			$img.css({marginLeft:-$img.width()/2+30});
		});
		if (res.type == 'image') {
			$('#images').append($res);
		} else {
			var $datasource = $('#datasource-'+src.id);
			if ($datasource.length == 0) {
				$datasource = addSource(src,search,info);
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
		var q = gup('q');
		if(q) switchDetailToList();
		var socket = io.connect(location.host);
		$('#q').val(q);
		var total;
		var progress;
		socket.on('welcome', function (data) {
			console && console.log('welcome!');
			if (q) {
				if (haveSearched) return;
				haveSearched = true;
				$('#q').addClass('spinner');
			  	socket.emit('search', {
			  		q: q
			  	});
				fixProgress(0.02);
			  	progress = 0;
		  	}
		});
		socket.on('search_started', function (data) {
			console.log(data);
			total += data.sourceCount+1;
			progress ++;
			fixProgress(progress/total);
		});
		socket.on('search_results', function (data) {
			console.log(data.source.id);
			$('#datasource-'+data.source.id+' span.more-results').remove();
			for(var i in data.results) {
				addResult(data.source,data.results[i],data.search,data.info);
			}
			if (data.info.more) {
				$('<span class="more-results">še zadetkov</span>')
				.click(function() {
					if ($(this).hasClass('loading')) return;
					socket.emit('search_more',{source:data.source.id});
					$(this).addClass('loading');
				})
				.appendTo('#datasource-'+data.source.id);
			}
			progress ++;
			fixProgress(progress/total);
		});
		socket.on('source_error', function (data) {
			console.log(data.source,data.message);
			$('#datasource-'+data.source+' span.more-results').remove();
			progress ++;
			fixProgress(progress/total);
		});
		socket.on('search_complete', function (data) {
			fixProgress(1);
			progress = 0;
			total = 0;
			setTimeout(fixColumns,0);
			setTimeout( function() {
				fixProgress(0)
			}, 250);
		});
		ret.q = q;
		ret.socket = socket;
		
		
		
		$('#results .result')
		.live('click',go);
//		.live('touchstart',go)
//		.live('touchmove',function(e){e.preventDefault()})
//		.live('touchend',function(e){e.preventDefault()});
	
		var scrollFromWheel;
	  	$('#images-scroll')
		.bind('mousewheel', function(event, delta) {
			scrollFromWheel = true;
			this.scrollLeft -= delta * 120;
      	})
        //TODO: set this on view mode change, avoid checking class on each mouse wheel event
	    $('body.mode-list #results-scroll').live('mousewheel',function(e,delta) {
	    	e.preventDefault();
	    	scrollFromWheel = true;
    		this.scrollLeft -= delta * 120;
	    });
/*	    
	    var $overlay = $('#results-overlay');
	    var overlayShown = false;
	    var overlayTimeout = null;
	    function hideOverlay () {
	    	$overlay
	    	.animate({opacity:0},300,function() {
		    	$('#results-overlay').css('display','none');
		    	overlayShown=false;
	    	});
	    }
	    function showOverlay() {
	    	$overlay
	    	.css({display:'block',opacity:0,background:'url(/static/img/mouse_wheel.png) center center no-repeat'})
	    	.animate({opacity:1},300);
	    	overlayShown=true;
	    }
	    $('body.mode-list #results-scroll').bind('scroll',function(e,delta) {
	    	if (scrollFromWheel) {
	    		scrollFromWheel= false;
	    		return;
	    	}
	    	if (!overlayShown) {
	    		showOverlay()
	    	} 
	    	clearTimeout(overlayTimeout);
	    	overlayTimetout=setTimeout(hideOverlay,600);
	    });
*/	    
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
