#include<X11/Xlib.h>
#include<X11/X.h>
#include<X11/Xutil.h>
#include<X11/extensions/XTest.h>
#include<iostream>
#include<stdio.h>
#include<unistd.h>

#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>

typedef websocketpp::server<websocketpp::config::asio> server;

void on_message(websocketpp::connection_hdl, server::message_ptr msg) {
        std::cout << msg->get_payload() << std::endl;
        Display *disp = XOpenDisplay(NULL);
        if (disp==NULL){
            std::cout << "problem getting display" << std::endl;
        }
        XTestFakeRelativeMotionEvent(disp, 50, 50, CurrentTime);
        XFlush(disp);

}

int main(){

    server print_server;

    print_server.set_message_handler(&on_message);

    print_server.init_asio();
    print_server.listen(8000);
    print_server.start_accept();

    print_server.run();

    return 0;

}
