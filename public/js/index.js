$(document).ready(function() {

	function resizeCalendar() {
		var fullHeight = $('#calendar').height();
		var calendarHeight = $('.fc-slats').height() + $('thead').height() + 1;
		
		$('#calendar').fullCalendar('option', 'height', Math.min(fullHeight, calendarHeight));
	}

	$(window).on('resize', resizeCalendar);

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
		viewRender: resizeCalendar
	});

});