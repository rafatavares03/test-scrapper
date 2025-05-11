# run: agencia cnn g1 forum

# agencia:
# 	node agencia_brasil.js  

# cnn:
# 	node cnn.js

# forum:
# 	node forum.js

# g1:
# 	node g1.js

# tempo:
# 	node tempo.js

# uol:
# 	node uol.js

run:
	node agencia_brasil.js > agencia_brasil.txt 2>&1 &&\
	node cnn.js > cnn.txt 2>&1 &&\
	node g1.js > g1.txt 2>&1 &&\
	node forum.js > forum.txt 2>&1 &&\
	node tempo.js > tempo.txt 2>&1 &&\
	node uol.js > uol.txt 2>&1 


clean:
	rm -rf *txt