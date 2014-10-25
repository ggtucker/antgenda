window.MON = 1;
window.TUE = 2;
window.WED = 3;
window.THU = 4;
window.FRI = 5;

window.COURSE_CODE_INDEX = 0;
window.COURSE_TYPE_INDEX = 1;
window.COURSE_SECTION_INDEX = 2;
window.COURSE_UNITS_INDEX = 3;
window.COURSE_INSTRUCTOR_INDEX = 4;
window.COURSE_TIME_INDEX = 5;
window.COURSE_PLACE_INDEX = 6;
window.COURSE_FINAL_INFO_INDEX = 7;
window.COURSE_MAX_INDEX = 8;
window.COURSE_ENROLLED_INDEX = 9;
window.COURSE_WAITLIST_INDEX = 10;
window.COURSE_REQUESTS_INDEX = 11;
window.COURSE_RESTRICTIONS_INDEX = 12;
window.COURSE_WEBSITE_INDEX = 14;
window.COURSE_STATUS_INDEX = 15;

window.MAX_COURSE_DURATION = 5;

$(document).ready(function() {

	function windowResize() {
		var fullHeight = $('#calendar').height();
		var calendarHeight = $('.fc-slats').height() + $('thead').height() + 1;
		
		$('#calendar').fullCalendar('option', 'height', Math.min(fullHeight, calendarHeight));
	}

	function renderEvent(event, element) {

		var course = event.course;

		element.find('.fc-title').html(course.id + ' ' + course.type + '<br><i>Room: ' + course.place + '</i>');

		element.attr('href', 'javascript:void(0);');
		element.click(function() {
			$('#eventInfo').load('js/event_dialog.html', function() {
				$('#course_name').text(course.name);
				$('#course_id').text(course.id);
				$('#course_code').text(course.code);
				$('#course_type').text(course.type);
				$('#course_section').text(course.section);
				$('#course_units').text(course.units);
				$('#course_instructors').text(course.instructors);
				var days = '';
				course.time.days.forEach(function(day) {
					days += moment().isoWeekday(day).format('ddd') + ',';
				});
				days = days.substring(0, days.length - 1);
				$('#course_time').text(days + ': ' + event.start.format('h:mm') + '-' + event.end.format('h:mma'));
				$('#course_place').html(course.place_link);
				if(course.final_info) {
					$('#course_final').text(course.final_info.beginMoment.format('ddd, MMM Do, h:mm') + '-' + course.final_info.endMoment.format('h:mma'));
				}
				$('#course_max').text(course.max);
				$('#course_enrolled').text(course.enrolled);
				$('#course_enrolled_total').text(course.enrolled_total);
				$('#course_waitlist').text(course.waitlist);
				$('#course_requested').text(course.requested);
				$('#course_restrictions').text(course.restrictions);
				if(course.website != undefined) {
					$('#course_website').html('<a target="_blank" href="' + course.website + '">Link</a>');
				}
				$('#course_status').text(course.status);

				eventPopup(event);
				
			});

		})
	}

	function eventExists(id) {
		var events = $("#calendar").fullCalendar('clientEvents', id);
		return events.length > 0;
	}

	function eventPopup(event) {
		$('#eventContent').dialog({
			modal: true,
			title: event.title,
			resizable: false,
			draggable: false,
			width: 'auto',
			height: 'auto',
			dialogClass: 'eventDialog',
			buttons: [
				{
					text: "Remove",
					click: function() {
						$('#calendar').fullCalendar('removeEvents', event.id);
						$(this).dialog("close");
					}
				},
				{
					text: "Back",
					click: function() {
						$(this).dialog("close");
					}
				}
			]
		});
	}

	// Wire up window events
	$(window).on('resize', windowResize);

	$(window).resize(function() {
		$( "#eventContent" ).dialog( "option", "position", { my: "center", at: "center", of: window } );
	});

	// Configure calendar
	var cal = $('#calendar').fullCalendar({
		header: {
			left: '',
			center: '',
			right: ''
		},
		defaultView: 'agendaWeek',
		weekends: false, // will hide Saturdays and Sundays
		editable: false,
		allDaySlot: false,
		minTime: '06:00:00',
		columnFormat: { week: 'ddd' },
		viewRender: windowResize,
		eventRender: renderEvent
	});

	// Register click event on course listings
	$('#soc').bind('load', function() {
		var $listingContext = $('.course-list', $('#soc').contents());
		var $courseRow = $(".course_tr", $listingContext);

		$courseRow.on('click', function() {

			var course = parseCourse($(this));

			if(!course) {
				return;
			}

			var days = course.time.days;
			days.forEach(function(day) {

				var startMoment = moment().startOf('week').add(day, 'days').hour(course.time.beginHour).minute(course.time.beginMin);
				var endMoment = moment().startOf('week').add(day, 'days').hour(course.time.endHour).minute(course.time.endMin);

				var courseEvent = {
					id: course.code,
					title: 'Placeholder',
					allDay: false,
					start: startMoment,
					end: endMoment,
					course: course
				};

				$('#calendar').fullCalendar('renderEvent', courseEvent);
			});
		});
	});

	function parseCourse(course) {

		var parsedCourse = {};

		parsedCourse.code = course.find('td').eq(COURSE_CODE_INDEX).text();
		if(eventExists(parsedCourse.code)) {
			alert('Course already added');
			return;
		}

		// Parse time function
		parsedCourse.time = parseCourseTime(course.find('td').eq(COURSE_TIME_INDEX).html());
		if(!parsedCourse.time) {
			alert('Course is TBA');
			return;
		}

		// Parse name and id function
		var nameAndId = parseNameAndId(course.prevAll('.course_name').first().children().first());
		parsedCourse.name = nameAndId.name;
		parsedCourse.id = nameAndId.id;

		// Parse website
		parsedCourse.website = parseWebsite(course.find('td').eq(COURSE_WEBSITE_INDEX));

		// Parse enrolled and total enrolled
		var enrolledInfo = parseEnrolledInfo(course.find('td').eq(COURSE_ENROLLED_INDEX).text());
		parsedCourse.enrolled = enrolledInfo.enrolled;
		parsedCourse.enrolled_total = enrolledInfo.enrolled_total;

		// Parse final info
		parsedCourse.final_info = parseFinalInfo(course.find('td').eq(COURSE_FINAL_INFO_INDEX).text());

		// Parse instructors
		parsedCourse.instructors = parseInstructors(course.find('td').eq(COURSE_INSTRUCTOR_INDEX).html());

		parsedCourse.type = course.find('td').eq(COURSE_TYPE_INDEX).text();
		parsedCourse.section = course.find('td').eq(COURSE_SECTION_INDEX).text();
		parsedCourse.units = course.find('td').eq(COURSE_UNITS_INDEX).text();
		
		parsedCourse.place = course.find('td').eq(COURSE_PLACE_INDEX).text();
		parsedCourse.place_link = course.find('td').eq(COURSE_PLACE_INDEX).html();
		parsedCourse.max = course.find('td').eq(COURSE_MAX_INDEX).text();

		parsedCourse.waitlist = course.find('td').eq(COURSE_WAITLIST_INDEX).text();
		parsedCourse.requests = course.find('td').eq(COURSE_REQUESTS_INDEX).text();
		parsedCourse.restrictions = course.find('td').eq(COURSE_RESTRICTIONS_INDEX).text();

		parsedCourse.status = course.find('td').eq(COURSE_STATUS_INDEX).text();

		console.log(parsedCourse);
		return parsedCourse;
	}

	function parseNameAndId(nameRow) {

		var name = nameRow.children().first().children().first().text().trim();
		var id = nameRow.html().split('<font')[0].replace(/&nbsp;/g, '').trim();

		return {
			'name': name,
			'id': id
		};
	}

	function parseCourseTime(timeString) {
		/*
		Used to parse the horribly inconsistent time string formats
		
		Assumptions:
		1. earliest possible course time is 6am
		2. latest possible course time is 9pm
		3. course durations never exceed 5 hours

		Acceptable Inputs:
		valid start hours        6,7,8,9,10,11,12,1,2,3,4,5,6,7,8,9
		valid start am hours     6,7,8,9,10,11
		valid start pm hours                   12,1,2,3,4,5,6,7,8,9

		valid end hours            7,8,9,10,11,12,1,2,3,4,5,6,7,8,9,10
		valid end am hours         7,8,9,10,11
		valid end pm hours                     12,1,2,3,4,5,6,7,8,9,10
		
		no +12h                                12
		
		Input: "Th &nbsp; 12:30-12:50p "

		*/

		if(timeString.indexOf('TBA') != -1) {
			return;
		}

		var dashedSplit = timeString.split('-'); // ex. ["Th &nbsp; 12:30", "12:50p "]
		var dayBeginSplit = dashedSplit[0].split('&nbsp;'); // ex. ["Th ", " 12:30"]

		var beginTime = $.trim( dayBeginSplit[dayBeginSplit.length - 1] ); // ex. "6:00"
		var endTime   = $.trim( dashedSplit[1] ); // "6:50p"

		var beginHour = parseInt( beginTime.split(':')[0] );
		var beginMin  = parseInt( beginTime.split(':')[1] );
		
		var endHour = parseInt( endTime.split(':')[0] );
		var endMin = parseInt( endTime.split(':')[1].replace('p', '') );
		var isPm = endTime.indexOf('p') != -1;

		var days = []
		if(timeString.indexOf('M') != -1) {	days.push(MON); } 
		if(timeString.indexOf('Tu') != -1) { days.push(TUE); } 
		if(timeString.indexOf('W') != -1) {	days.push(WED); }
		if(timeString.indexOf('Th') != -1) { days.push(THU); }
		if(timeString.indexOf('F') != -1) {	days.push(FRI); }

		if(isPm) {
			var military = endHour == 12 ? 12 : endHour + 12

			if(military - beginHour > MAX_COURSE_DURATION) {
				beginHour += 12;
			} 

			if(endHour != 12) {
				endHour += 12;
			}

		}

		return {
			'beginHour': beginHour,
			'beginMin': beginMin,
			'endHour': endHour,
			'endMin': endMin,
			'days': days
		}
	}

	function parseFinalInfo(finalInfo) {
		finalInfo = finalInfo.trim();

		if(finalInfo == '' || finalInfo == 'TBA') {
			return;
		}

		var splitFinal = finalInfo.split(', ');

		var dayString = splitFinal[0]; // ex. Thu
		var dateString = splitFinal[1]; // ex. Dec 18
		var timeString = splitFinal[2]; // ex. 1:30-3:30pm

		var day = 0;
		if(dayString == 'Mon') { day = 1; }
		if(dayString == 'Tue') { day = 2; }
		if(dayString == 'Wed') { day = 3; }
		if(dayString == 'Thu') { day = 4; }
		if(dayString == 'Fri') { day = 5; }

		var dateSplit = dateString.split(' ');

		var dashedSplit = timeString.trim().split('-');
		var beginTime = dashedSplit[0];
		var endTime = dashedSplit[1];

		var beginHour = parseInt( beginTime.split(':')[0] );
		var beginMin  = parseInt( beginTime.split(':')[1] );
		
		var endHour = parseInt( endTime.split(':')[0] );
		var endMin = parseInt( endTime.split(':')[1].replace('p', '') );
		var isPm = endTime.indexOf('p') != -1;

		if(isPm) {
			var military = endHour == 12 ? 12 : endHour + 12

			if(military - beginHour > MAX_COURSE_DURATION) {
				beginHour += 12;
			} 

			if(endHour != 12) {
				endHour += 12;
			}

		}

		var month = dateSplit[0];
		var dayOfMonth = parseInt(dateSplit[1]);
		var beginMoment = moment().month(month).date(dayOfMonth).hour(beginHour).minute(beginMin);
		var endMoment = moment().month(month).date(dayOfMonth).hour(endHour).minute(endMin);

		return {
			'day': day,
			'beginMoment': beginMoment,
			'endMoment': endMoment
		}
	}

	function parseWebsite(website) {
		return website.children().first().attr('href');
	}

	function parseEnrolledInfo(enrolledInfo) {
		var enrolledSplit = enrolledInfo.trim().split(' / ');

		var enrolled = enrolledSplit[0];
		var enrolled_total = enrolledSplit[1];

		if(enrolledSplit.length == 1) {
			enrolled_total = enrolled;
		}

		return {
			'enrolled': enrolled,
			'enrolled_total': enrolled_total
		}
	}

	function parseInstructors(instructors) {
		return instructors.split('<br>');
	}

});