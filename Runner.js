/* This is the version in which red = M and blue = B */

define(['managerAPI'], function(Manager){

	var API    = new Manager();
    var global = API.getGlobal();
    // API.addSettings('logger', {url: '/data', type: 'dflt'});

	API.addTasksSet(
	{
		stopSignal :
		[{
			type: 'time', name: 'stopSignal', scriptUrl: 'stop-signal.js'
		}]
	});

//define the sequence of the study
    API.addSequence([
        {inherit: 'stopSignal'}
	]);
	
	return API.script;
});
