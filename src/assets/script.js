//CHANGE THIS
var LOCAL_IP = "192.168.1.16"

alert("Local IP set to: " + LOCAL_IP)

var ws = new WebSocket("ws:"+LOCAL_IP+":9000")
var old_pos = [0,0,0,0,0,0]
var prev_acc = [0,0,0,0,0,0]
var prev_vel = [0,0,0,0,0,0]
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
var send_raw = false;
var grip_down = false;
var grip_as_toggle = true;


function toggle_grip(){
    if (grip_down){
        grip_down = false;
        //send_up_down(9,false)
    } else {
        grip_down = true;
        //send_up_down(9, true)
    }
}

function toggle_raw(){
    send_raw = (!send_raw)
    send_sensor(0,0)
    send_sensor(1,0)
    send_sensor(2,0)
    send_sensor(3,0)
    send_sensor(4,0)
    send_sensor(5,0)
}

function send_sensor(id,value){
    prefix = ""

    if (id < 10){
        prefix = "0"
    }
    ws.send(prefix+id+value)
}

function send_up_down(id, down){
    prefix = ""
    if (id < 10){
        prefix = "0"
    }
    state = ""
    if (down){
        state = "d"
    }
    else{
        state = "u"
    }
    ws.send(prefix+id+state);
}


function calc_send_pos(val, delta, index, id){
    var new_vel = ((delta*((val + prev_acc[index])/2)) + prev_vel[index]) / 10
    var new_pos = ((delta) * ((new_vel + prev_vel[index]) / 2) + old_pos[index])
    send_sensor(id, (new_pos - old_pos[index]))
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

        if (send_raw){
            send_sensor(0,sensor_arr[0])
            send_sensor(1,sensor_arr[1])
            send_sensor(2,sensor_arr[2])
            send_sensor(3,sensor_arr[3])
            send_sensor(4,sensor_arr[4])
            send_sensor(5,sensor_arr[5])
        }
        if (!grip_down){
            cursor_x = sensor_arr[x_cursor_index] * -0.15
            cursor_y = sensor_arr[y_cursor_index] * -0.05

            calc_send_pos(cursor_x, current_tick - last_tick, 0, 10)
            calc_send_pos(cursor_y, current_tick - last_tick, 1, 11)
        }
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
        send_up_down(6,true)
        if("vibrate" in window.navigator) {
            window.navigator.vibrate(100);
        }
    })
    $("#lmb").on("pointerup",function() {
        send_up_down(6,false)
    })

    $("#rmb").on("pointerdown",function() {
        send_up_down(7,true)
    })
    $("#rmb").on("pointerup", function() {
        send_up_down(7,false)
    })
    $("#grip").on("pointerdown",function() {
        toggle_grip()

        $("#grip").toggleClass("mouseBtnDown")
    })
    $("#grip").on("pointerup", function() {
        if (!grip_as_toggle){
            toggle_grip()
            $("#grip").toggleClass("mouseBtnDown")
        }
    })
    $("#move").on("pointerdown", function(){
         toggle_raw();
         $("#move").toggleClass("mouseBtnDown")
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

