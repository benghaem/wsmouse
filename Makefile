CXX=clang++
CXXFLAGS=-Wall -std=c++11
XLIBS= -lX11 -lXtst
BOOSTLIB= -lboost_system


bin/wsmouse: src/wsmouse.cpp
	$(CXX) $(CXXFLAGS) $(XLIBS) $(BOOSTLIB) src/wsmouse.cpp -o bin/wsmouse

clean:
	rm -rf bin/*


.PHONY: clean
