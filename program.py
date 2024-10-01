from decimal import Decimal # This used for making the yields not read as 0.00000 instead of xE-10

# This is the path to the ndx file (The data file)
pathToFile = "P107JAICRP_38_3_Nuclear_Decay_Data_suppl_data/P 107 JAICRP 38(3) Nuclear Decay Data for Dosimetric Calculations(supplementary data)"

# Reading from the file
with open(pathToFile + '/ICRP-07.NDX') as f:
    lines = f.readlines()

# CLASS FOR OBJECTS IN obj
class RadioNuclide():
    '''Radionuclide class for ICRP 107 Publication'''
    def __init__(self, name: str, halflife: str, unit: str, decaymethod: str, daughters: dict):
        self.__name = name
        self.__halflife = halflife
        self.__unit = unit
        self.__decaymethod = decaymethod
        
        ## difficult so keep seperate.

        daughterDict = {}
        for key, value in daughters.items():
            #if not str(key).startswith("0 "):
            #daughterDict.update({str(key).split(" ")[1]:value})
            if not key == "":
                daughterDict.update({str(key).split(" ")[0]:value})
        
        
        self.__daughters = daughterDict

    def get_name(self):
        '''Returns the name of an object'''
        return self.__name
    
    def get_halflife(self):
        '''Returns the half-life of an object'''
        return self.__halflife

    def get_unit(self):
        '''Returns the unit of an object'''
        return self.__unit
    
    def get_decaymethod(self):
        '''Returns the decay method of an object'''
        return self.__decaymethod
    
    def get_daughters(self):
        '''Returns the daughters of an object'''
        return self.__daughters

    def get_decay_chain(self, yield_multiplier=1.0 , depth=0, visited=None):
        '''Return the decay chain of a given element.
        Formatted with ':::' for seperating each element, and +'s represent depth.'''
        if visited is None:
            visited = set()

        decayChain = []
        decayChain.append([depth * "+" + self.get_name() + " ,HalfLife: " + standard_form_to_superscript(self.get_halflife()) + " " + self.get_unit() + ",Yield: " + standard_form_to_superscript(str('%.3E' % Decimal(yield_multiplier)))])  # Adjusted indentation
        daughters = self.get_daughters()

        for key, value in daughters.items():
            daughter = objs[searchFor(key)] 
            yield_value = float(value) * yield_multiplier

            if daughter.get_name() not in visited:
                visited.add(daughter.get_name())
                decayChain.extend(daughter.get_decay_chain(yield_value, depth + 1, None))

        if depth == 0:
            visited.clear()

        return decayChain

    def get_radioactivedecay_chain(self):
        '''Returns the b64 image of the decay chain, given a radionuclide name as a string (Uses radioactivedecay library).'''
        import radioactivedecay as rd       # ONLY IMPORT WHEN YOU NEED IT SO DOESN'T 
        import matplotlib.pyplot as plt     # USE UP TOO MUCH SYSTEM MEMORY FOR NOTHING.
        import io
        import base64

        nuc = rd.Nuclide(self.get_name())
        nuc.plot()

        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)

        # PLOT TO BASE64
        b64Image = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return(b64Image)
    
    def unit_to(self, newUnit):                             #usage:   RN = 'name' of a Radionuclide. e.g. "Ac-232".
        'change RN (original value) to newUnit'
        'e.g. h ---> d:   RN/24 turns from h to d'
        
        index = objs[searchFor(self.get_name,"name")]
        val = float(index.get_halflife())

        originalUnit = index.get_unit()

        # First I will convert all values into seconds
        if originalUnit == 'm':
            val = val * 60
        elif originalUnit == 'h':
            val = val * 3600
        elif originalUnit == 'd':
            val = val * 86400
        elif originalUnit == 'y':
            val = val * 31536000
        elif originalUnit == 'u':
            val = val / 1000000
        elif originalUnit == 'ms':
            val = val / 1000
        
        if newUnit == 'm':
            val = val / 60
        elif newUnit == 'h':
            val = val / 3600
        elif newUnit == 'd':
            val = val / 86400
        elif newUnit == 'y':
            val = val / 31536000
        elif newUnit == 'u':
            val = val * 1000000
        elif newUnit == 'ms':
            val = val * 1000
        
        return val


def searchFor(RN: str, f="r"):                   #f = format -- search for Name,HalfLife,Amount of Daughters, etc. 
    #                                               write binary search here WHERE RN=theValue and f=FORMAT' # FORMAT WAS NEVER USED.
    '''This gets the index of the item in the objs list for which the input of the function is the name of a RadioNuclide.
    e.g. searchFor('Ar-37') will return 53, as objs[53].name is Ar-37.'''
    left = 0                            # -- left pointer
    right = len(objs) - 1               # -- right pointer

    while left <= right:
        mid = (left + right) // 2                                   # might implement caching algorithm for real time searches
        #print(mid)
        mid_obj = objs[mid].get_name()

        if mid_obj == RN:
            return mid
        elif mid_obj < RN:
            left = mid + 1
        else:
            right = mid - 1
 # string is not anywhere in list of Radionuclides (MEANING IS A STABLE NUCLIDE as I know there will always be a radionuclide called)
 # add stable nuclide to objs list
    stable = RadioNuclide(RN, 'Stable', '', '', {})
    #print(getName(objs[mid]))
    objs.insert(mid, stable)
    objs.sort(key=lambda x: x.get_name()) #sort list by name just incase 'mid' is not the correct place to put in the list.
    return mid
# return last item in list
    
def getContains(elementName: str):
    '''Returns a string (formatted as a list) which returns all of the isotopes of an element.'''
    isotopes = [obj.get_name() for obj in objs if obj.get_name().startswith(elementName + '-')]
    return ', '.join(isotopes)

def standard_form_to_superscript(s: str): 
    '''Replaces the +'s and -'s of an input to superscript variations of them. (This is used for formatting with the frontend)'''
    output = s.replace('-', '⁻').replace('+', '⁺')
    return output

# Create the objects in the class (Radionuclides)
objs = list() # Create a list called objs (objects) to store all the Radionuclides

for i in range(1, len(lines)): # Loops as many times as there are lines in the ndx file
    objName =           lines[i][:7].replace(" ", "")
    objHalfLife =       lines[i][7:15].replace(" ", "")
    objUnit =           lines[i][15:17].replace(" ", "")
    objDecayMethod =    lines[i][17:25].replace(" ", "")
    objDaughter1 =      lines[i][53:60].replace(" ", "")
    objYield1 =         lines[i][66:77].replace(" ", "")
    objDaughter2 =      lines[i][78:85].replace(" ", "")
    objYield2 =         lines[i][92:102].replace(" ", "")
    objDaughter3 =      lines[i][103:110].replace(" ", "")
    objYield3 =         lines[i][117:127].replace(" ", "")
    objDaughter4 =      lines[i][128:135].replace(" ", "")
    objYield4 =         lines[i][142:152].replace(" ", "")
    
    objs.append(RadioNuclide(objName, objHalfLife, objUnit, objDecayMethod,  {objDaughter1:objYield1, objDaughter2:objYield2, objDaughter3:objYield3, objDaughter4:objYield4})) 
    # Add (or append) a new item 

print('Imported template file successfully.')
#This is called when there are no errors in the program.
