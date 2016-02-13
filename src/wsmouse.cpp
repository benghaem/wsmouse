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

void on_message(Display *disp, server *s, websocketpp::connection_hdl, server::message_ptr msg) {
        std::cout << msg->get_payload() << std::endl;
        int x = atoi(msg->get_payload().c_str());
        XTestFakeRelativeMotionEvent(disp, x, 0, CurrentTime);
        XFlush(disp);
}

int main(){

    Display *disp = XOpenDisplay(NULL);
    if (disp==NULL){
            std::cout << "problem getting display" << std::endl;
            exit(1);
        }

    server wsmouse_server;

    wsmouse_server.set_message_handler(bind(&on_message, disp, &wsmouse_server, ::_1, ::_2));
    wsmouse_server.init_asio();
    wsmouse_server.listen(9000);
    wsmouse_server.start_accept();

    wsmouse_server.run();

    return 0;
}
