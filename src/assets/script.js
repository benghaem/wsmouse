var ws = new WebSocket("ws:10.0.1.150:9000")
var old_pos = [0,0,0]
var prev_acc = [0,0,0]
var prev_vel = [0,0,0]
var last_tick = Date.now()
var current_tick = Date.now()

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

    //x = event.accelerationIncludingGravity.x - 0.0655
    //y = event.accelerationIncludingGravity.z - 0.06 +9.8
    x = (event.rotationRate.gamma + 0.05)* -0.15
    y = ( event.rotationRate.alpha) * -0.1
    //y = (y - 0.2) * 100
    //x = x * 50


    if (x < 0.01 && x > -0.02 ){
         x = 0
    }
    if (y < 0.02 && y > -0.02 ){
         y = 0
    }

    push(x, current_tick - last_tick, 0)
    push(y, current_tick - last_tick, 1)
    //ws.send(pretty_print(x))
    //ws.send(event.acceleration.y)
    //ws.send(event.acceleration.z)
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

})

//Disable scroll
document.ontouchstart = function(e){ e.preventDefault(); }

