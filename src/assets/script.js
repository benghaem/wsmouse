var ws = new WebSocket("ws:10.0.1.150:9000")
var old_pos = [0,0,0]
var prev_acc = [0,0,0]
var prev_vel = [0,0,0]
var last_tick = Date.now()
var current_tick = Date.now()
var calibrate = false
//x,y,z,a,b,g
var sensor_cal_stdev = [0,0,0,0,0,0]
var sensor_cal_offset = [0,0,0,0,0,0]
var x_cursor_index = 5
var y_cursor_index = 3
var cal_arr = [[],[],[],[],[],[]]
var cal_cycles = 0

function push(val, delta, index){
    var new_vel = ((delta*((val + prev_acc[index])/2)) + prev_vel[index]) / 10
    var new_pos = ((delta) * ((new_vel + prev_vel[index]) / 2) + old_pos[index])
    ws.send(index + " " + (new_pos - old_pos[index]))
    old_pos[index] = new_pos
    prev_vel[index] = new_vel
}

function pretty_print(x){
    round_x = Math.round(x) + 30
    nice = ""
    for(round_x; round_x > -1; round_x--){
        nice = nice + "1"
    }
    return nice
}

window.addEventListener('devicemotion',function(event){
    last_tick = current_tick
    current_tick = Date.now()

    var x = event.accelerationIncludingGravity.x
    var y = event.accelerationIncludingGravity.y
    var z = event.accelerationIncludingGravity.z
    var a = event.rotationRate.alpha
    var b = event.rotationRate.beta
    var g = event.rotationRate.gamma

    var sensor_arr = [x,y,z,a,b,g]


    if (!calibrate){
        //x = event.accelerationIncludingGravity.x - 0.0655
        //y = event.accelerationIncludingGravity.z - 0.06 +9.8
        //x = (event.rotationRate.gamma + 0.05)* -0.15
        //y = ( event.rotationRate.alpha) * -0.1
        //y = (y - 0.2) * 100
        //x = x * 50

        //apply calibration
        for (i = sensor_arr.length - 1; i >= 0; i--){
            //remove calculated offset
            sensor_arr[i] = sensor_arr[i] - sensor_cal_offset[i]
            var val = sensor_arr[i]
            var stdev = sensor_cal_stdev[i]
            //if within one standard dev set to zero
            if (val < stdev*2 && val > stdev * -2){
                sensor_arr[i] = 0
            }
        }

        cursor_x = sensor_arr[x_cursor_index] * -0.15
        cursor_y = sensor_arr[y_cursor_index] * -0.05

        push(cursor_x, current_tick - last_tick, 0)
        push(cursor_y, current_tick - last_tick, 1)

    } else {
        if (cal_cycles < 1000){
            for(i=sensor_arr.length-1; i>=0; i--){
                cal_arr[i].push(sensor_arr[i]);
            }
            cal_cycles++
            $("#cali").text( cal_cycles / 10 + "% complete")
        } else {
            //calculating stdev and average for each sensor input
            for(i=cal_arr.length-1; i>=0; i--){
                //find mean
                var len =cal_arr[i].length;
                var sum = cal_arr[i].reduce(function(a,b){return a + b});
                var mean = sum / len
                //subtract mean and square
                var oper_arr = cal_arr[i].map(function(x){(x - mean)^2});
                //mean of oper_arr
                var oper_mean = oper_arr.reduce(function(a,b){return a + b}) / len;
                var stdev = Math.sqrt(oper_mean)
                sensor_cal_offset[i] = mean;
                sensor_cal_stdev[i] = stdev;
            }
            calibrate = false
            calibrate_done = true
            cal_cycles = 0
            cal_arr = [[],[],[],[],[],[]]
            document.getElementById("cali").innerHTML = "Calibrate complete"
        }

    }
})

$(function(){
    $("#lmb").on("pointerdown",function() {
        ws.send("6d")
    })
    $("#lmb").on("pointerup",function() {
        ws.send("6u")
    })

    $("#rmb").on("pointerdown",function() {
        ws.send("7d")
    })
    $("#rmb").on("pointerup", function() {
        ws.send("7u")
    })
    $("#release").on("pointerdown",function() {
        ws.send("9d")
    })
    $("#release").on("pointerup", function() {
        ws.send("9u")
    })

    $("#cali").on("pointerdown",function(){
        if (calibrate == false){
            calibrate = true;
        }
        console.log("Calibration started")
    })

})

//Disable scroll
document.ontouchstart = function(e){ e.preventDefault(); }

