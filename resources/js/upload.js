function addToCookie(filename) {
	removeFromCookie(filename)

	var cookieStorage = $.cookie('files');
	if (cookieStorage == undefined) {
		cookieStorage = '';
	}

	cookieStorage = cookieStorage + filename + '|';

	$.cookie('files', cookieStorage, { expires: 7, path: '/' });
}

function removeFromCookie(filename) {
	var cookieStorage = $.cookie('files');
	if (cookieStorage == undefined) {
		cookieStorage = '';
		$.cookie('files', cookieStorage, { expires: 7, path: '/' });
		return;
	}

	cookieStorage = cookieStorage.replace(filename + '|',"");

	$.cookie('files', cookieStorage, { expires: 7, path: '/' });
}

function getFilesListFromCookie() {
	var cookieStorage = $.cookie('files');
	if (cookieStorage == undefined || cookieStorage == ""){
		return false;
	}

	var parts = cookieStorage.split("|");
	parts.pop();

	return parts
}

/**
 * Flow JS
 */
var UploadLogic = {

	flow : false,
	firstPart: true,
	progress1: 0,
	timer1: false,
	
	init : function () {

		UploadLogic.flow = new Flow({
			target: '/upload/',
			uploadMethod: 'POST',
			testChunks: true,
			simultaneousUploads: 1,
			prioritizeFirstAndLastChunk: true,
			progressCallbacksInterval: 0,
			singleFile: true
		});


		if (!UploadLogic.flow.support) {
			Msg.error("Browser dose not support modern upload!");
		}

		UploadLogic.bindEvents();
	},


	submitSetup : function () {



	},

	bindEvents: function () {

		var self = this;

		UploadLogic.flow.assignBrowse(document.getElementById('js-upload-files'));
		UploadLogic.flow.assignDrop(document.getElementById('drop-zone'));

		UploadLogic.flow.on('fileAdded', function(file, event){
			addToCookie(file.name);

			setTimeout(function(){

				UploadLogic.flow.upload();
				Screen.show("screen-error-bar");
				
			},1);

		});

		UploadLogic.flow.on('fileSuccess', function(file,message){
			removeFromCookie(file.name);
		    $('#fileLog').append('<a href="#" class="list-group-item list-group-item-success"><span class="badge alert-success pull-right">Success</span>' + file.name + ' ' + message + '</a>');
		});
		UploadLogic.flow.on('fileError', function(file, message){
			removeFromCookie(file.name);
		    $('#fileLog').append('<a href="#" class="list-group-item list-group-item-danger"><span class="badge alert-danger pull-right">Error</span>' + file.name + ' ' + message + '</a>');
		});

		UploadLogic.flow.on('fileProgress', function () {

			console.log("fileProgress", UploadLogic.flow.progress());

			if (UploadLogic.firstPart == true) {
				

				UploadLogic.flow.pause();
					

				$.ajax({
					url: "/check/",
					dataType: "json"
				}).done(function(data) {
					
					console.log(data);

					if(data.Procede===true)
					{
						console.log("Procede yes");


						Screen.show("screen-setup-bar");

						var videoInfo = "Video info: <strong>";
						if(data.OriginalInfo.Duration_string!==undefined) videoInfo += " Duration: " + data.OriginalInfo.Duration_string;
						if(data.OriginalInfo.Resolution!==undefined) videoInfo += " | Resolution: " + data.OriginalInfo.Resolution;
						if(data.OriginalInfo.Framerate!==undefined) videoInfo += " | Framerate: " + data.OriginalInfo.Framerate + " fps";
						if(data.OriginalInfo.AspectRatio!==undefined) videoInfo += " | AspectRatio: " + data.OriginalInfo.AspectRatio;
						if(data.OriginalInfo.Bitrate_bps!==undefined) videoInfo += " | Bitrate: " + data.OriginalInfo.Bitrate_bps + " bps";
						videoInfo += "</strong>";

						Msg.info(videoInfo);
					}
					else
					{
						console.log("Procede no");

						Screen.show("screen-error-bar");
						Msg.error(data.Err);
					}

				});
			}
			else 
			{

				UploadLogic.progress = UploadLogic.flow.progress() * 100;
	
				if ( UploadLogic.progress > 0 && UploadLogic.progress < 100 ) 
				{
					$('.progress-bar').css('width', Math.round(UploadLogic.progress) + '%');
				}
				else
				{
					$('.progress-bar').css('width', '100%');
				}

			}
		});

		UploadLogic.flow.on('complete', function(){

		    $('#fileLog').append('<a href="#" class="list-group-item list-group-item-success"><span class="badge alert-success pull-right">Success</span>All upload completed</a>');

		    Screen.show('screen-converting-bar');

		    setTimeout(function(){

		    	Screen.show('screen-download-bar');

		    }, 5000);

		});
		
		UploadLogic.flow.on('uploadStart', function(){
			
			if(Screen.active=="screen-drop-zone")
			{
				Screen.show("screen-check-bar");
			}
			else
			{
				Screen.show("screen-progress-bar");	
			}

		});


		$('.trigger-browse-files').on("click", function(e){
			e.preventDefault();
			$('input[type=file]').click();
			console.log("asdasdasd");
	    	return false;
		});

		$("#drop-zone").on("dragover", function(){
			$(this).addClass("over");
		});

		$("#drop-zone").on("dragleave", function(){
			$(this).removeClass("over");
		});

		$('#js-upload-form').on("submit", function(ev){
			ev.preventDefault();
			
			setTimeout(function(){
				UploadLogic.flow.upload();
			},1);
		});

		$("form#output_data").on("submit", function(e){
			
			e.preventDefault();
			
			console.log("setup", UploadLogic.flow);

			setTimeout(function(){

				UploadLogic.firstPart = false;
				UploadLogic.flow.resume();
				
			},1);

			var form_data = $(this).serialize();
			
			var send_data = {
				output_width: 0,
				output_height: 0,
				output_leave_audio: 0,
				output_generate_html: 0
			};



			if(form_data.output_size==1)
			{
				send_data.output_width = 854;
				send_data.output_height = 480;
			}
			else if(form_data.output_size==2)
			{
				send_data.output_width = 1280;
				send_data.output_height = 720;
			}
			else if(form_data.output_size==3)
			{
				send_data.output_width = 1920;
				send_data.output_height = 1080;
			}
			
			if(form_data.leave_audio!==undefined && form_data.leave_audio==1)
			{
				send_data.output_leave_audio = 1;
			}
			
			if(form_data.generate_html!==undefined && form_data.generate_html==1)
			{
				send_data.output_generate_html = 1;
			}


			$.ajax({
				url: "/encode/",
				dataType: "json",
				data: send_data,
			}).done(function(data){
				

			});


		});		

	}
};


jQuery(document).ready(function(){

	UploadLogic.init();

});