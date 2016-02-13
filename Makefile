CXX=clang++
CXXFLAGS=-Wall -std=c++11
XLIBS= -lX11 -lXtst
BOOSTLIB= -lboost_system


clean:
	rm -rf bin/*

build: src/wsmouse.cpp
	$(CXX) $(CXXFLAGS) $(XLIBS) $(BOOSTLIB) src/wsmouse.cpp -o bin/wsmouse

.PHONY: clean build
