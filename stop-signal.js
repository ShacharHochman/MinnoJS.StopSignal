define(['pipAPI'], function(APIconstructor) {

    var API     = new APIconstructor();
    var global  = API.getGlobal();
    var current = API.getCurrent();
    API.addSettings('onEnd', window.minnoJS.onEnd);
    API.addSettings('logger', {
        // gather logs in array
        onRow: function(logName, log, settings, ctx){
            if (!ctx.logs) ctx.logs = [];
            ctx.logs.push(log);
        },
        // onEnd trigger save (by returning a value)
        onEnd: function(name, settings, ctx){
            return ctx.logs;
        },
        // Transform logs into a string
        // we save as CSV because qualtrics limits to 20K characters and this is more efficient.
        serialize: function (name, logs) {
            var headers = ['SlideName', 'SSD', 'Response', 'RT', 'Correct', 'data.response', 'Stop.NoStop', 'CorrectResponse', 'PracExp'];
            var content = logs.map(function (log) { return [log.name, log.data.stop_signal_time, log.responseHandle, log.latency, log.data.score, log.data.response, log.data.type, log.data.correct, log.data.block]; });
            console.log(content)
            content.unshift(headers);
            return toCsv(content);

            function toCsv(matrice) { return matrice.map(buildRow).join('\n'); }
            function buildRow(arr) { return arr.map(normalize).join(','); }
            // wrap in double quotes and escape inner double quotes
            function normalize(val) {
                var quotableRgx = /(\n|,|")/;
                if (quotableRgx.test(val)) return '"' + val.replace(/"/g, '""') + '"';
                return val;
            }
        },
        // Set logs into an input (i.e. put them wherever you want)
        send: function(name, serialized){
            window.minnoJS.logger(serialized);
        }
    });


    var version_id      = Math.random()>0.5 ? 2 : 1;

    var all_answers     = [['d', 'l', 'x'],['l', 'd', 'x']];
    var answers     = all_answers[version_id-1];



 	API.addCurrent({
 	    answers :answers,
 	    version_id: version_id,
 	    feedback     : '',
 	    instructions :{
            inst_welcome : `<font size=5>
                                <p>AAAYou will now have the experiment's practice </p><br>
                                <P>Your response keys instructions are as follows:</p><br>

                                <p>If the letter is <b>${version_id===1 ? 'O' : 'X'}</b>, hit the <b>L</b> key with your right hand.</p>
                                <p>If the letter is <b>${version_id===1 ? 'X' : 'O'}</b>, hit the <b>D</b> key with your right hand.</p><br>

                                <p style="color:red"><b>IMPORTANT If shortly after the letter appears, a box is shown around it, DO NOT RESPOND at all. Wait for the next trial</b></p><br>

                                <p>Please put your fingers on the keyboard to get ready</p></br>

                                <p>Press SPACE to start a short practice</p>
                            </font>`,
            inst_start   : `<font size=5>
                                <p>The practice has now ended.</p></br>
                                <p>Remember: </p></br>

                                <p>If the letter is <b>${version_id===1 ? 'O' : 'X'}</b>, hit the <b>L</b> key with your right hand.</p>
                                <p>If the letter is <b>${version_id===1 ? 'X' : 'O'}</b>, hit the <b>D</b> key with your right hand.</p><br>

                                <p style="color:red"><b>IMPORTANT If shortly after the letter appears, a box is shown around it, DO NOT RESPOND at all. Wait for the next trial</b></p><br>

                                <p>Please put your fingers on the keyboard to get ready</p></br>

                                <p>Press SPACE to continue</p>
                            </font>`,

            inst_bye     : `<p>This is the end of the experiment</p>
                            <p>Thank you for your participation</p>
                            <p>To end please press SPACE</p>`
        },

        times: {
            first_stop_signal_time  : 250,
            stop_signal_time  : 250,

            fixation_duration : 300,
            stimulus_duration : 1700,
            feedback_duration : 1500,
            iti_duration      : 500
        },

        frame            : 'https://raw.githubusercontent.com/ShacharHochman/MinnoJS.StopSignal/master/images/frame.png',

        minScore4exp     : 0,
        trials4practice  : 8,

        score             : 0,
        trial_count       : 1
	});



    API.addSettings('canvas',{
        textSize         : 5,
        maxWidth         : 1200,
        proportions      : 0.65,
        borderWidth      : 0.4,
        background       : '#ffffff',
        canvasBackground : '#ffffff'
    });

    //the source of the images
    API.addSettings('base_url',{
        image : global.baseURL
    });

    /***********************************************
    // Stimuli
     ***********************************************/



    API.addStimulusSets({
        defaultStim: [{data : {alias:'default'}, css:{color:'black','font-size':'100px'}}], //general
        fixation : [{
            inherit:'defaultStim', data:{handle:'fixation', alias:'fixation'},
            media: '+'
        }],
        error : [{
            inherit:'defaultStim', data:{handle:'error', alias:'error'},
            media: {word: 'Wrong answer'}
        }],
        correct : [{
            inherit:'defaultStim', data:{handle:'correct', alias:'correct'},
            media: {word: 'Well Done!'}
        }],
        timeoutmessage : [{
            inherit:'defaultStim', data:{handle:'timeoutmessage', alias:'timeoutmessage'},
            media: {word: 'Respond faster'}
        }],
        shouldStop : [{
            inherit:'defaultStim', data:{handle:'shouldStop', alias:'shouldStop'},
            media: {html: 'Do not press any button if a square appears'}
        }],
        inst_welcome : [{
            inherit:'defaultStim', data:{handle: 'instructions', alias:'instructions'},
            media:{html: current.instructions.inst_welcome}
        }],
        inst_start : [{
            inherit:'defaultStim', data:{handle: 'instructions', alias:'instructions'},
            media:{html: current.instructions.inst_start}
        }]
    });


    API.addTrialSets('insts',{
        input: [ //Inputs for skipping.
            {handle:'space',on:'space'} // this is for advancing the trials.
        ],
        interactions: [
            { // end instructions
                conditions: [{type:'inputEquals',value:'space'}], //What to do when space is pressed
                actions: [
                    {type:'log'}, //Hide the instructions
                    {type:'endTrial'}
                ]
            }
        ]
    });


    API.addTrialSets('inst_welcome',{
        inherit:'insts',
	    layout: [
	        {media: {html: current.instructions.inst_welcome}}
        ]
    });

    API.addTrialSets('inst_start',{
        inherit:'insts',
	    layout: [
	        {media: {html: current.instructions.inst_start}}
        ]
    });



    /***********************************************
    // Main trials
     ***********************************************/

    API.addTrialSets('main',[{
        data: {score:0},
        interactions: [
         { // begin trial
                conditions: [{type:'begin'}],
                actions: [
                    {type:'showStim', handle:'fixation'}, // show fixation
                    {type:'trigger', handle:'show_stimuli', duration:'<%= current.times.fixation_duration %>'}, // remove fixation after 500 ms
                    {type:'custom', fn: function(a, b, trial){trial.data.stop_signal_time = global.current.times.stop_signal_time;}}
                ]
            },
            {
                conditions:[{type:'inputEquals',value:'show_stimuli'}],
                actions: [
                    {type:'trigger',handle:'showTarget'},
                    {type:'trigger',handle:'ITI', duration: '<%= current.times.stimulus_duration %>'}
                ]
            },

            {
                conditions:[{type:'inputEquals',value:'show_stimuli'},
                            {type:'custom', fn: function(a, b, trial){return trial.data.type === 'nogo';}}],
                actions: [
                    {type:'custom', fn: function(a, b, trial){console.log(global.current.times.stop_signal_time);}},

                    {type:'trigger',handle:'showSignal', duration: '<%= global.current.times.stop_signal_time %>'}
                ]
            },


            /* Display the stop-signal stimulus. */
            {
                conditions:[{type:'inputEquals',value:'showSignal'}],
                actions: [
                    {type:'showStim', handle: 'signal'}
                ]
            },

            /* Display the target stimulus. */
            {
                conditions:[{type:'inputEquals',value:'showTarget'}],
                actions: [

                    {type:'hideStim', handle:['fixation']},

                    {type:'resetTimer'}, // record RT from here on
				    {type:'setInput', input:{handle:current.answers[0], on: 'keypressed', key: current.answers[0]}},
				    {type:'setInput', input:{handle:current.answers[1], on: 'keypressed', key: current.answers[1]}},

                    {type:'showStim', handle: 'target'},
                    {type:'trigger',handle:'targetOut', duration:'<%= current.times.stimulus_duration %>'}
                ]
            },


            {
                conditions: [{type:'inputEquals', value:'targetOut'}], // what to do after removing the target
                actions: [
                    {type:'hideStim', handle:'target'},
                    {type:'trigger', handle: '<%= trialData.type ==="go" ? "timeout" : "correct_inhibition" %>'} // set response deadline - trial ends when it is due
                ]
            },


            /* nogo */
            {
                conditions: [{type:'inputEquals', value:'correct_inhibition'}],
                actions: [
                    {type:'custom',fn: function(){global.current.times.stop_signal_time = Math.min (global.current.times.stop_signal_time+50, current.times.stimulus_duration);
                    }}
                ]
            },

            {
                conditions: [{type:'inputEquals', value:current.answers},
                             {type:'inputEqualsStim', property:'correct', negate:true},
                            {type:'custom', fn: function(a, b, trial){return trial.data.type === 'nogo';}}],
                actions: [
                    {type:'removeInput', handle:['targetOut']},
                    {type:'removeInput', handle:['m']},
                    {type:'removeInput', handle:['b']},

                    {type:'custom',fn: function(){global.current.times.stop_signal_time = Math.max(0, global.current.times.stop_signal_time-50);}},
                    {type:'hideStim', handle:['All']}

                ]
            },
            /*****/

            {
                conditions: [{type:'inputEqualsStim', property:'correct'}], //Correct response
                actions: [
                    {type:'removeInput', handle:['targetOut']},
                    {type:'removeInput', handle:['m']},
                    {type:'removeInput', handle:['b']},
                    {type:'setTrialAttr', setter:{score:1}},
                    {type:'log'},
                    {type:'custom',fn: function(){global.current.score++; global.current.feedback  = 'correct';}},
                    {type:'hideStim', handle:['All']}
                ]
            },

            {
                conditions: [{type:'inputEquals', value:current.answers},
                             {type:'inputEqualsStim', property:'correct', negate:true}], //Incorrect response
                actions: [
                    {type:'removeInput', handle:['showSignal']},
                    {type:'removeInput', handle:['targetOut']},
                    {type:'removeInput', handle:['m']},
                    {type:'removeInput', handle:['b']},

                    {type:'setTrialAttr', setter:{score:0}},
                    {type:'log'},
                    {type:'custom',fn: function(a, b, trial){global.current.feedback = trial.data.type === 'go' ? 'error' : 'shouldStop';}},
                    {type:'hideStim', handle:['All']}
                ]
            },

            {
                conditions: [{type:'inputEquals', value:'correct_inhibition'}],
                actions: [
                    {type:'setTrialAttr', setter:{score:1}},
                    {type:'log'},
                    {type:'custom',fn: function(){global.current.score++; global.current.feedback = 'correct';}},
                    {type:'hideStim', handle:['All']}

                ]
            },

            {
                conditions: [
                    {type:'inputEquals',value:'timeout'}], // what to do upon the timeoutP trigger
                actions: [
                    {type:'setTrialAttr', setter:{score:-1}},
                    {type:'log'},
                    {type:'custom',fn: function(){global.current.feedback = 'timeoutmessage';}},
                    {type:'hideStim', handle:['All']}
                ]
            },

            /* Inter trial interval */

            {
                conditions: [
                    {type:'inputEquals', value:'ITI'},
                    {type:'currentEquals',property:'feedback', value:'correct'},
                    {type:'custom',fn: function(a, b, trial){return trial.data.block==='practice';}}
                ],
                actions: [
                    {type:'showStim', handle: 'correct'},
                    {type:'trigger', handle:'clean',duration: '<%= current.times.feedback_duration %>'}
                ]
            },

            {
                conditions: [
                    {type:'inputEquals', value:'ITI'},
                    {type:'currentEquals',property:'feedback', value:'error'},
                    {type:'custom',fn: function(a, b, trial){return trial.data.block==='practice';}}
                ],
                actions: [
                    {type:'showStim', handle: 'error'},
                    {type:'trigger', handle:'clean',duration: '<%= current.times.feedback_duration %>'}
                ]
            },

            {
                conditions: [
                    {type:'inputEquals', value:'ITI'},
                    {type:'currentEquals',property:'feedback', value:'shouldStop'},
                    {type:'custom',fn: function(a, b, trial){return trial.data.block==='practice';}}
                ],
                actions: [
                    {type:'showStim', handle: 'shouldStop'},
                    {type:'trigger', handle:'clean',duration: '<%= current.times.feedback_duration %>'}
                ]
            },

            {
                conditions: [
                    {type:'inputEquals', value:'ITI'},
                    {type:'currentEquals',property:'feedback', value:'timeoutmessage'},
                    {type:'custom',fn: function(a, b, trial){return trial.data.block==='practice';}}
                ],
                actions: [
                    {type:'showStim', handle: 'timeoutmessage'},
                    {type:'trigger', handle:'clean',duration: '<%= current.times.feedback_duration %>'}
                ]
            },
            {
                conditions: [{type:'inputEquals', value:'clean'}],
                actions:[
                    {type:'hideStim', handle:['All']}
                ]
            },
            {
                conditions: [{type:'inputEquals', value:'ITI'}],
                actions:[
                    {type:'custom',fn: function(){global.current.trial_count++;}},
                    {type:'removeInput', handle:['All']},
                    {type:'trigger', handle:'end',duration:'<%= trialData.block==="practice" ? current.times.feedback_duration+current.times.iti_duration : current.times.iti_duration %>'}
                ]
            },

            /* End trial */
            // if current.score is high enough, then proceed to next trial, else, try the practice again
                        {
                conditions: [ // incorrect & too many trials
                    {type:'custom',fn: function(a, b, trial){return trial.data.block==='practice';}},
                    {type:'custom',fn: function(){return global.current.score < global.current.minScore4exp;}},
                    {type:'custom',fn: function(){return global.current.trial_count >= global.current.trials4practice;}}
                ],
                actions: [
                    {type:'custom',fn: function(){global.current.score=0;}},
                    {type:'custom',fn: function(){global.current.trial_count=0;}},
                    {type:'goto',destination: 'previousWhere', properties: {practice:true}}
                ]
            },
            {
                conditions: [ // correct & enough trials
                    {type:'custom',fn: function(a, b, trial){return trial.data.block==='practice';}},
                    {type:'custom',fn: function(){return global.current.score >= global.current.minScore4exp;}},
                    {type:'custom',fn: function(){return global.current.trial_count > global.current.trials4practice;}}
                ],
                actions: [
                        {type:'custom',fn: function(){global.current.score=0;}},
                        {type:'custom',fn: function(){global.current.trial_count=0;}},
                        {type:'custom',fn: function(){global.current.times.stop_signal_time = global.current.times.first_stop_signal_time;}},

                        {type:'trigger', handle:'endOfPractice',duration:'<%= current.times.feedback_duration %>'}
                ]
            },
            {
                conditions: [{type:'inputEquals', value:'endOfPractice'}],
                actions: [
                    {type:'goto',destination: 'nextWhere', properties: {exp:true}}
                ]
            },
            {
                conditions: [ {type:'inputEquals', value:'end'} ],
                actions: [ {type:'endTrial' }]
            }
        ],
        stimuli : [
            {inherit:'shouldStop'},
            {inherit:'error'},
            {inherit:'correct'},
            {inherit:'timeoutmessage'},
            {inherit:'fixation'}
        ]
    }]);


    /***********************************************
    // Specific color trials
     ***********************************************/

    // main
    API.addTrialSets('trial_stimuli',[{
        inherit: {set:'main', merge:['stimuli']},
        stimuli: [
            {media:'<%= trialData.text %>', handle:'target', css:{fontSize: '100px'}, data:{type:'<%= trialData.type =>', correct: '<%= trialData.correct %>'}},
            {media: {image:current.frame}, handle:'signal'}

        ]
    }]);




API.addTrialSet('go', [
    {inherit: 'trial_stimuli', data: { response: true, text: 'X', type: 'go', correct: current.answers[0]}},
    {inherit: 'trial_stimuli', data: { response: true, text: 'O', type: 'go', correct: current.answers[1]}}
]);


API.addTrialSet('nogo', [
    {inherit: 'trial_stimuli', data: { response: false, text: 'X', type: 'nogo', correct: current.answers[2]}},
    {inherit: 'trial_stimuli', data: { response: false, text: 'O', type: 'nogo', correct: current.answers[2]}}
]);

    /***********************************************
    // Sequence
     ***********************************************/

	API.addSequence([
	    { //Instructions
    		data: {practice:true},
		    inherit : {set:"inst_welcome"}
	    },
	    {
			mixer: 'random',
			data: [
				{
					mixer: 'repeat',
					times: 4,
					data: [
                        {inherit:{set:'go', type:'equalDistribution', n: 4, 'seed': 'goP'}, data:{block: 'practice'}}
					]
				},
				{
					mixer: 'repeat',
					times: 4,
					data: [
                        {inherit:{set:'nogo', type:'equalDistribution', n: 4, 'seed': 'nogoP'}, data:{block: 'practice'}}
					]
				}
			]
		},
		{ //Start the experiment
		    data: {exp:true},
		    inherit : {set:"inst_start" }
		},
		{
			mixer: 'random',
			data: [
				{
					mixer: 'repeat',
					times: 10,
					data: [
                        {inherit:{set:'go', type:'equalDistribution', n: 10, 'seed': 'goE'}, data:{block: 'exp'}}
					]
				},
				{
					mixer: 'repeat',
					times: 10,
					data: [
                        {inherit:{set:'nogo', type:'equalDistribution', n: 10, 'seed': 'nogoE'}, data:{block: 'exp'}}
					]
				}
			]
		}
	]);
	return API.script;
});
