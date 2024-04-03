from flask import Flask, request, jsonify
from flask_cors import CORS
from waitress import serve

from program import getName
from program import getHalfLife
from program import getUnit
from program import getContains
from program import getDecayMethod
from program import get_decay_chain
from program import getradioactivedecay_chain
from program import searchFor

from program import objs

app = Flask(__name__)
cors = CORS(app)

@app.route("/receiver", methods=["POST"])
def postME():
   b64request = False
   data = request.get_json()

   # print(str(data)) (for debugging)
   # str(data) is the full command

   output = ""

   if data.get('Search'):
      print('Search: [{search}]'.format(search=data.get('Search')))
      isotopes = getContains(data.get('Search'))
      temp = isotopes.split()
      methods = ""
      halflife = ""
      unit = ""
      for i in range(len(temp)):
         index = searchFor(str(temp[i]).replace(",",""))
         methods = methods   + getDecayMethod(objs[index]) + ","
         halflife = halflife + getHalfLife(objs[index]) + ","
         unit = unit         + getUnit(objs[index]) + ","
         
      #Remove final commas.
      methods = methods[:-1]
      halflife = halflife[:-1]
      unit = unit[:-1]
      
      output = "{ \"isotopes\":\"" + isotopes + "\", \"decaymethods\":\"" + methods + "\", \"halflife\":\"" + halflife + "\", \"unit\":\"" + unit + "\"}"

   elif data.get('Info'):
      print('Info: [{info}]'.format(info=data.get('Info')))
      output = "{ \"HalfLife\":\"" + getHalfLife(objs[searchFor(str(data.get('Info')).replace(" ",""))]) + "\"}"
   
   elif data.get('Chain'):   
      print('CSS Chain: [{chain}]'.format(chain=data.get('Chain')))
      chainStr = ""
      chain = get_decay_chain(objs[searchFor(str(data.get('Chain')).replace(" ",""))])
      for i in range(len(chain)):
         chainStr = chainStr + str(chain[i]) + ":::"

      output = "{ \"chain\":\"" + chainStr + "\"}"
   

   elif data.get('ChainV2'):
      b64request = True
      print('Image Chain: [{chainV2}]'.format(chainV2=data.get('ChainV2')))
      b64 = getradioactivedecay_chain(data.get('ChainV2'))
      output = "{ \"b64\":\"" + b64 + "\"}"

   if not b64request:
      print(f'Output: [{output}]\n')
   else:
      print(f'Output: [b64 image (if issues change b64request to False)]\n')
      
   return(output)
   
if __name__ == "__main__":
   serve(app, host='0.0.0.0', port=5000, threads=1)
