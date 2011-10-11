/*
src = {	id, name, home }
res = {	url, title, description, image }
*/

function urlencode (str) {
    str = (str + '').toString();
    return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
    replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
}
function urldecode (str) {
	return decodeURIComponent((str + '').replace(/\+/g, '%20'));
}

Kultura = {
	gup:function( name )
	{
	  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	  var regexS = "[\\?&]"+name+"=([^&#]*)(&|$)";
	  var regex = new RegExp( regexS );
	  var results = regex.exec( window.location.href );
	  if( results == null )
		return "";
	  else
		return urldecode(results[1]);
	},
	
	makeResult: function(src, res) {
		var title = res.title.length>60 ? res.title.substr(0,57)+'...' : res.title;
		var description = res.description && res.description.length>200 ? res.description.substr(0,197)+'...' : res.description;
		return (
			'<div id="def-'+src.id+'" class="result '+res.type+'">'
		+		'<div class="source"><a href="'+src.home+'">'+src.name+'</a></div>'
		+	(res.image ? '<a href="'+res.url+'"><img class="image" title="'+res.title+'" src="'+res.image+'"></a>' : '')
		+		'<div class="title"><a href="'+res.url+'" title="'+res.title+'">'+title+'</a></div>'
		+		'<div class="description" title="'+res.description+'">'+description+'</a></div>'
		+		'<div class="url"><a href="'+res.url+'">'+res.url+'</a></div>'
		+	'</div>'
		);
	},
	addResult: {
		def: function (src,res) {
			var txt = this.makeResult(src,res);
			console.log(txt);
			$('#defs').append(this.makeResult(src,res));
			$('#heading-defs').css('display','block');
		},
		image: function(src,res) {
			$('#images').append(this.makeResult(src,res));
			$('#heading-images').css('display','block');
		},
		web: function(src,res) {
			$('#web').append(this.makeResult(src,res));
			$('#heading-web').css('display','block');
		},
		data: function(src,res) {
			$('#heading-data').css('display','block');
			if (!$('#data-'+src.id).length) {
				$('#data').append(
					'<div id="data-'+src.id+'" class="datasource">'
				+		'<div class="source"><a href="'+src.home+'">'+src.name+'</a></div>'
				+		'<div class="scroll"></div>'
				+	'</div>'
				);
			}
			$('#data-'+src.id+' > .scroll').append(this.makeResult(src,res));
		}
	}
}

$(function() {
	var socket = io.connect('http://kultura.ljudmila.net');
	var q = Kultura.gup('q');
	$('#q').val(q);
	socket.on('welcome', function (data) {
		console.log('welcome!');
		if (q) {
			$('#q').addClass('spinner');
		  	socket.emit('search', {
		  		q: q
		  	});
	  	}
	});
	socket.on('results', function (data) {
		console.log('results',data);
		for (var i in data.results) {
			console.log(data.results[i]);
			Kultura.addResult[data.results[i].type||'web'].apply(Kultura, [data.source,data.results[i]]);
		}
	});
	socket.on('endresults', function (data) {
		$('#q').removeClass('spinner');
	});

	Kultura.socket = socket;
});

