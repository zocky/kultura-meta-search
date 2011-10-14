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
    var $selectedClone=$('<div></div>');
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
	var $selected;
	var $selectedClone;
	var go = function (e) {
		var $body = $('body');
		var $this = $(this);
		$('.result.selected').removeClass('selected');
		$selectedClone.remove();
		var $res = $this.closest('.result');
		$res.addClass('selected');
		$selectedClone = $res
		.clone()
		.css({
			display:'none',
			position:'fixed',
			left:'0',
			zIndex:5,
		})
		.appendTo('#data');
		if ($body.hasClass('columns')) {
			var $cont = $('#data-wrap');
			var o = $this.offset();
			var t = o.top-$cont.offset().top;
			$body.addClass('to-detail');
			$('#detail-wrap').css({
				left:o.left+250,
				opacity:0,
				zIndex:10,
			}).animate({
				left:250,
				opacity:1,
			},600);
			$('#data').animate({
				left: -o.left+20
			},600,function() {
				$('#data').css({left:0});
				$body.removeClass('columns to-detail');
				$body.addClass('detail');
				$cont.get(0).scrollTop = $this.get(0).offsetTop - t;
			});
		}
	}


	function makeResult (src, res, search) {
		var title = shorten(res.title,60);
		var description = shorten(res.description,100);
		var $res =  $(
			'<div data-source="'+src.id+'"class="result '+res.type+'">'
		+		'<div class="source"><a href="'+src.home+'">'+src.name+'</a></div>'
		+	(res.image ? '<a target="detail" href="'+res.url+'"><img onerror="$(this).remove()" class="image" title="'+res.title+'" src="'+res.image+'"></a>' : '')
		+		'<div class="title"><a target="detail" href="'+res.url+'" title="'+res.title+'">'+title+'</a></div>'
		+		'<div class="description" title="'+res.description+'">'+description+'</a></div>'
		+		'<div class="url"><a href="'+res.url+'">'+res.url+'</a></div>'
		+	'</div>'
		);
		$res.find('a[target=detail]').click(go);
		return $res;
	}
	var addResultByType = {
		_: function (src,res,search) {
			var $res = makeResult(src,res);
			$('#'+res.type).append($res);
			$('#heading-'+res.type).add('#'+res.type).css('display','block');
			return $res;
		},
		image: function (src,res,search) {
			var $res = makeResult(src,res,search);
			$images = $('#image .result');
			if ($images.length == 0) {
				$('#heading-'+res.type).add('#'+res.type).css('display','block');
				$('#image').append($res);
			} else {
				$images.eq((Math.random()*$images.length)|0).after($res);
			}
		},
		data: function(src,res,search) {
			$('#heading-data, #data').css('display','block');
			if (!$('#data-'+src.id).length) {
				$('#data').append(
					'<div id="data-'+src.id+'" class="datasource">'
				+   '<div class="datasource-head">'
				+		'<div class="source"><img src="'+src.home+'/favicon.ico" onerror="$(this).remove()"><a target="detail" href="'+search+'">'+src.name+'</a>'
				+		'</div>'
				+	'</div>'
				+	'</div>'
				);
				$('#data-'+src.id+' > .datasource-head').append(makeResult(src,res,search));
			} else $('#data-'+src.id).append(makeResult(src,res,search));
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
	function addResult(src,res,search) {
		ret.types[res.type] = ret.types[res.type] || [];
		ret.types[res.type].push(res);
		ret.sources[src.id] = ret.sources[src.id] || [];
		ret.sources[src.id].push(res);
		(addResultByType[ res.type ] || addResultByType._) ( src , res , search );
	}
	var haveSearched = false;
	function setup () {
		$('body').addClass('columns');
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
				addResult(data.source,data.results[i],data.search);
			}
		});
		socket.on('endresults', function (data) {
			$('#q').removeClass('spinner');
		});
		ret.q = q;
		ret.socket = socket;
		
	    $('#image-wrap')
        .bind('mousewheel', function(event, delta) {
        	this.scrollLeft -= delta * 120;
        })
        //TODO: set this on view mode change, avoid checking class on each mouse wheel event
	    $('#data-wrap').bind('mousewheel',function(e,delta) {
	    	var $body = $('body');
	    	e.preventDefault();
	    	if($body.hasClass('columns')) {
	    		this.scrollLeft -= delta * 120;
	    	} else {
	    		this.scrollTop -= delta * 60;
	    		var $this = $(this);
	    		var o = $('.result.selected').offset();
	    		var t = $('#data-wrap').offset().top;
	    		if (o && o.top < t) {
		    		console.log($selectedClone);
	    			$selectedClone.css({
	    				display:'block',
	    				top: t-5,
	    				left:20,
	    				bottom: 'auto',
	    				height: 'auto',
	    			})
	    		} else if (o && o.top + $('.result.selected').height() > $('#data-wrap').height()+t) {
	    			$selectedClone.css({
	    				display:'block',
	    				top: 'auto',
	    				left: 20,
	    				bottom: '0',
	    				height: 'auto',
	    			})
	    		} else {
	    			$selectedClone.css({
	    				display:'none',
	    			})
	    		}
	    	}
	    });
		$('#submit').click(function(e) {
			if($('#q').val()==gup('q')) {
				e.preventDefault();
				$selectedClone && $selectedClone.hide();
				$('body').addClass('columns to-detail');
				var $sel = $('.selected');
				var l = $sel.offset().left;
				var $cont = $('#data-wrap');
				$cont.get(0).scrollLeft = l - $cont.width()/2 + 125;
				var l = $sel.offset().left;
				console.log($sel);
				$cont.css({
					left: 20-l
				}).animate({
					left: 0
				},600);
				$('#detail-wrap').animate({
					opacity:0,
					left: 2000,
				},function() {
					$('body').removeClass('to-detail');
				})
			}
		});
	}
	$(setup);
	return ret;
})();
