var ws = new WebSocket("ws:10.0.1.150:9000")
var old_pos = 0
var old_delta = 0
var prev_acc = 0
var prev_vel = 0
var last_tick = Date.now()
var current_tick = Date.now()

function push(x, delta){
    var new_vel = ((delta*((x + prev_acc)/2)) + prev_vel) / 10
    document.getElementById('x-v').innerHTML = new_vel
    var new_pos = ((delta) * ((new_vel + prev_vel) / 2) + old_pos)
    document.getElementById('x-p').innerHTML = new_pos
    ws.send(new_pos - old_pos)
    old_pos = new_pos
    prev_vel = new_vel
    old_delta = delta
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

    x = event.accelerationIncludingGravity.x - 0.0655
    //x = (event.rotationRate.gamma + 0.05)* -1

    if (x < 0.01 && x > -0.02 ){
         x = 0
    }

    document.getElementById('x').innerHTML = x


    push(x, current_tick - last_tick)
    //ws.send(pretty_print(x))
    //ws.send(event.acceleration.y)
    //ws.send(event.acceleration.z)
})
