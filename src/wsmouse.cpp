#include<X11/Xlib.h>
#include<X11/X.h>
#include<X11/Xutil.h>
#include<X11/extensions/XTest.h>
#include<iostream>
#include<stdio.h>
#include<unistd.h>

#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>

using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::placeholders::_3;
using websocketpp::lib::bind;

typedef websocketpp::server<websocketpp::config::asio> server;

void on_message(Display *disp, server *s, bool *acc_on, websocketpp::connection_hdl, server::message_ptr msg) {
        //std::cout << msg->get_payload() << std::endl;
        std::string base = msg->get_payload();
        int msgid= atoi(base.substr(0,1).c_str());
        //std::cout << base.substr(0,1) << ":" << msgid << std::endl;
        int value = 0;
        bool down = false;
        if (msgid >=0 && msgid < 6){
            value = atoi(base.substr(2).c_str());
        }
        if (msgid >= 6 && msgid <= 9){
           // std::cout << base.substr(1) << std::endl;
            down = (base[1] == 'd');
            if (down){
                std::cout << "mousedown" <<std::endl;
            } else {
                std::cout << "mouseup" << std::endl;
            }
        }
        //std::cout << msgid << ": " << value << std::endl;
        int x = 0;
        int y = 0;
        int z = 0;
        if (msgid == 0){
            x = value;
        } else if (msgid == 1){
            y = value;
        } else if (msgid == 2){
            z = value;
        } else if (msgid == 6){
            XTestFakeButtonEvent(disp, 1, down, CurrentTime);
        } else if (msgid == 7){
            XTestFakeButtonEvent(disp, 3, down, CurrentTime);
        } else if (msgid == 9){
            *acc_on = !down;
        }
        if (*acc_on){
            XTestFakeRelativeMotionEvent(disp, x, y, CurrentTime);
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

    server wsmouse_server;

    wsmouse_server.set_message_handler(bind(&on_message, disp, &wsmouse_server, &acc_on, ::_1, ::_2));
    wsmouse_server.init_asio();
    wsmouse_server.listen(9000);
    wsmouse_server.start_accept();

    wsmouse_server.run();

    return 0;
}
