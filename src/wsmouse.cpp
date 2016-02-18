#include<X11/Xlib.h>
#include<X11/X.h>
#include<X11/Xutil.h>
#include<X11/extensions/XTest.h>
#include<iostream>
#include<stdio.h>
#include<unistd.h>

#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>
#include <map>

using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::placeholders::_3;
using websocketpp::lib::bind;

const unsigned int W_KEY = 25;
const unsigned int A_KEY = 38;
const unsigned int S_KEY = 39;
const unsigned int D_KEY = 40;

typedef websocketpp::server<websocketpp::config::asio> server;

void diff_keypress(Display *disp, std::map<char,bool> *map, char key, bool down, unsigned int keycode){
    bool current_state = (*map)[key];
    if (current_state != down){
        (*map)[key] = down;
        XTestFakeKeyEvent(disp, keycode, down, CurrentTime);
        XFlush(disp);
    }
}

//protocol defn
// 99 channels
// 0 - 5   : 6 axis data x,y,z,a,b,g : IDsensor_value
// 6 - 8   : lmb, rmb, mmb           : IDu or IDd
// 9       : grip                    : IDu or IDd
// 10 - 11 : rel_x_pos, rel_y_pos    : IDrel_pos


void on_message(Display *disp, server *s, bool *acc_on, std::map<char,bool>* keys_pressed, websocketpp::connection_hdl, server::message_ptr msg) {
        //std::cout << msg->get_payload() << std::endl;
        std::string base = msg->get_payload();
        int msgid = atoi(base.substr(0,2).c_str());
        //std::cout << msgid << std::endl;
        int sensor_val = 0;
        int rel_x_pos = 0;
        int rel_y_pos = 0;// x,y
        bool down = false;

        //if one of the sensor channels 0 - 5
        if (msgid >=0 && msgid < 5){
            int val = atoi(base.substr(2).c_str());
            sensor_val = val;
        }
        //if one of the up/down channels 6 - 9
        else if (msgid >= 6 && msgid <= 9){
           // std::cout << base.substr(1) << std::endl;
            down = (base[2] == 'd');
            if (down){
                std::cout << "btndown" <<std::endl;
            } else {
                std::cout << "btnup" << std::endl;
            }
        }
        //rel pos channels
        else if (msgid >= 10 && msgid <= 11){
            //std::cout << "got rel pos" << std::endl;
            int val = atoi(base.substr(2).c_str());
            std::cout<<val<<std::endl;
            if (msgid == 10){
                rel_x_pos = val;
            } else{
                rel_y_pos = val;
            }
        }
        //do stuff with x values
        if (msgid == 0){
            if (sensor_val < -1){
                diff_keypress(disp,keys_pressed,'a',true,A_KEY);
                diff_keypress(disp,keys_pressed,'d',false,D_KEY);
            }
            else if (sensor_val > 1){
                diff_keypress(disp,keys_pressed,'a',false,A_KEY);
                diff_keypress(disp,keys_pressed,'d',true,D_KEY);
            } else{
                diff_keypress(disp,keys_pressed,'a',false,A_KEY);
                diff_keypress(disp,keys_pressed,'d',false,D_KEY);
            }
        }        //do stuff with y values
        if (msgid == 1){
            if (sensor_val > 1){
                diff_keypress(disp,keys_pressed,'w',true,W_KEY);
                diff_keypress(disp,keys_pressed,'s',false,S_KEY);
            }
            else if (sensor_val < -1){
                diff_keypress(disp,keys_pressed,'w',false,W_KEY);
                diff_keypress(disp,keys_pressed,'s',true,S_KEY);
            } else{
                diff_keypress(disp,keys_pressed,'w',false,W_KEY);
                diff_keypress(disp,keys_pressed,'s',false,S_KEY);
            }
        }

        if (msgid == 6){
            XTestFakeButtonEvent(disp, 1, down, CurrentTime);
        } else if (msgid == 7){
            XTestFakeButtonEvent(disp, 3, down, CurrentTime);
        } else if (msgid == 9){
            *acc_on = !down;
        }
        if (*acc_on && ( msgid == 10 || msgid == 11 )) {
            XTestFakeRelativeMotionEvent(disp, rel_x_pos, rel_y_pos, CurrentTime);
            XFlush(disp);
        }
}


int main(){

    Display *disp = XOpenDisplay(NULL);
    if (disp==NULL){
            std::cout << "problem getting display" << std::endl;
            exit(1);
        }

    bool acc_on = true;
    std::map<char,bool> keys_pressed;

    server wsmouse_server;

    wsmouse_server.set_message_handler(bind(&on_message, disp, &wsmouse_server, &acc_on, &keys_pressed, ::_1, ::_2));
    wsmouse_server.init_asio();
    wsmouse_server.listen(9000);
    wsmouse_server.start_accept();

    wsmouse_server.run();

    return 0;
}
