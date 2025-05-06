#version 430

#define EPSILON 0.001
#define BIG 25
#define MAX_SIZE 64

out vec4 FragColor;
in vec3 glPosition;
uniform int MaterialIdx;
uniform int RayTracingDepth;

const int DIFFUSE = 1;
const int REFLECTION = 2;
const int REFRACTION = 3;

const int DIFFUSE_REFLECTION = 1;
const int MIRROR_REFLECTION = 2;
const int REFRACT_REFLECTION = 3;

struct SSphere
{
	vec3 Center;
	float Radius;
	int MaterialIdx;
};

struct STriangle
{
	vec3 v1;
	vec3 v2;
	vec3 v3;
	int MaterialIdx;
};

struct SLight
{
	vec3 Position;
};

struct SMaterial
{
	vec3 Color;				//diffuse color
	vec4 LightCoeffs;		// ambient, diffuse and specular coeffs
	float ReflectionCoef;	
	float RefractionCoef;	// (0.0 - 1.0)
	float IOR;				// ( IOR >= 1.0 )
	int MaterialType;		// 0 - non-reflection, 1 - mirror
};

struct SIntersection
{
	float Time;
	vec3 Point;
	vec3 Normal;
	int MaterialIdx;
};

struct SCamera
{
	vec3 Position;
	vec3 View;
	vec3 Up;
	vec3 Side;
	vec2 Scale;
};

struct SRay
{
	vec3 Origin;
	vec3 Direction;
};

struct STracingRay
{
	SRay ray;
	float contribution;
	int depth;
	float currentIOR;
};




SCamera initializeDefaultCamera()
{
	SCamera camera;
	camera.Position = vec3(0.0, 0.0, -9.0);
	camera.View = vec3(0.0, 0.0, 1.0);
	camera.Up = vec3(0.0, 1.0, 0.0);
	camera.Side = vec3(1.0, 0.0, 0.0);
	camera.Scale = vec2(1.0);
	return camera;
}

SCamera uCamera = initializeDefaultCamera();
SLight light;
STriangle triangles[12];
SSphere spheres[2];
SMaterial materials[6];
float Unit = 1.0;
SLight uLight;

struct Stack {
    STracingRay items[MAX_SIZE];
    int top;
};

Stack myStack;

void initStack() {
	myStack.top = -1;
}

bool isFull() {
    return myStack.top == MAX_SIZE - 1;
}

bool isEmpty() {
    return myStack.top == -1;
}

bool push(STracingRay item) {
    if (!isFull()) {
		myStack.items[++myStack.top] = item;
		return true;
	}
	return false;
}

STracingRay pop() {
    if (!isEmpty()) {
		return myStack.items[myStack.top--];
	}
}




void initializeDefaultScene()
{
	/* left wall */
	triangles[0].v1 = vec3(-5.0,-5.0,-5.0);
	triangles[0].v2 = vec3(-5.0, 5.0, 5.0);
	triangles[0].v3 = vec3(-5.0, 5.0,-5.0);
	triangles[0].MaterialIdx = 5;
	triangles[1].v1 = vec3(-5.0,-5.0,-5.0);
	triangles[1].v2 = vec3(-5.0,-5.0, 5.0);
	triangles[1].v3 = vec3(-5.0, 5.0, 5.0);
	triangles[1].MaterialIdx = 5;
	
	/* back wall */
	triangles[2].v1 = vec3(-5.0,-5.0, 5.0);
	triangles[2].v2 = vec3( 5.0,-5.0, 5.0);
	triangles[2].v3 = vec3(-5.0, 5.0, 5.0);
	triangles[2].MaterialIdx = 4;
	triangles[3].v1 = vec3( 5.0, 5.0, 5.0);
	triangles[3].v2 = vec3(-5.0, 5.0, 5.0);
	triangles[3].v3 = vec3( 5.0,-5.0, 5.0);
	triangles[3].MaterialIdx = 4;
	
	/* right wall */
	triangles[4].v1 = vec3( 5.0,-5.0,-5.0);
	triangles[4].v2 = vec3( 5.0, 5.0,-5.0);
	triangles[4].v3 = vec3( 5.0, 5.0, 5.0);
	triangles[4].MaterialIdx = 3;
	triangles[5].v1 = vec3( 5.0,-5.0,-5.0);
	triangles[5].v2 = vec3( 5.0, 5.0, 5.0);
	triangles[5].v3 = vec3( 5.0,-5.0, 5.0);
	triangles[5].MaterialIdx = 3;

	/* roof */
	triangles[6].v1 = vec3(-5.0, 5.0,-5.0);
	triangles[6].v2 = vec3(-5.0, 5.0, 5.0);
	triangles[6].v3 = vec3( 5.0, 5.0, 5.0);
	triangles[6].MaterialIdx = 0;
	triangles[7].v1 = vec3( 5.0, 5.0, 5.0);
	triangles[7].v2 = vec3( 5.0, 5.0,-5.0);
	triangles[7].v3 = vec3(-5.0, 5.0,-5.0);
	triangles[7].MaterialIdx = 0;
	
	/* floor */
	triangles[8].v1 = vec3(-5.0,-5.0,-5.0);
	triangles[8].v2 = vec3( 5.0,-5.0,-5.0);
	triangles[8].v3 = vec3(-5.0,-5.0, 5.0);
	triangles[8].MaterialIdx = 0;
	triangles[9].v1 = vec3( 5.0,-5.0,-5.0);
	triangles[9].v2 = vec3( 5.0,-5.0, 5.0);
	triangles[9].v3 = vec3(-5.0,-5.0, 5.0);
	triangles[9].MaterialIdx = 0;

	triangles[10].v1 = vec3(-3.0, -2.0, 4.0);
	triangles[10].v2 = vec3( 0.0, -2.0, 4.0);
	triangles[10].v3 = vec3(-3.0, 1.0, 4.0);
	triangles[10].MaterialIdx = 2;
	triangles[11].v1 = vec3( 0.0, 1.0, 4.0);
	triangles[11].v2 = vec3(-3.0, 1.0, 4.0);
	triangles[11].v3 = vec3( 0.0, -2.0, 4.0);
	triangles[11].MaterialIdx = 2;

	/** SPHERES **/
	spheres[0].Center = vec3(-1.0,-1.0,1.5);
	spheres[0].Radius = 3.0;
	spheres[0].MaterialIdx = 0;
	
	spheres[1].Center = vec3(3.5, 1.0, 2.0);
	spheres[1].Radius = 1.0;
	spheres[1].MaterialIdx = 3;
}

void initializeDefaultLightMaterials()
{
	
	uLight.Position = vec3( 2.0, 1.0, -4.0 );
	
	vec4 lightCoefs = vec4(0.4, 0.9, 0.0, 512.0);
	vec4 lightCoefs_Glass = vec4(0.2, 0.1, 0.1, 512.0);

	/* WHITE - DIFFUSE	*/
	materials[0].Color = vec3(1.0, 1.0, 1.0);
	materials[0].LightCoeffs = vec4(lightCoefs);
	materials[0].ReflectionCoef = 0.5;
	materials[0].RefractionCoef = 1.0;
	materials[0].IOR = 1.0;
	materials[0].MaterialType = DIFFUSE;
	
	/* PURPLE */
	materials[1].Color = vec3(1.0, 0.0, 1.0);
	materials[1].LightCoeffs = vec4(lightCoefs);
	materials[1].ReflectionCoef = 1.0;
	materials[1].RefractionCoef = 0.0;
	materials[1].IOR = 1.0;
	materials[1].MaterialType = DIFFUSE;
	
	/* WHITE TEST REFL|REFR */
	materials[2].Color = vec3(1.0, 1.0, 1.0);
	materials[2].LightCoeffs = vec4(lightCoefs);
	materials[2].ReflectionCoef = 0.2;
	materials[2].RefractionCoef = 0.2;
	materials[2].IOR = 1.6;
	materials[2].MaterialType = REFRACTION;
	
	/* GREEN */
	materials[3].Color = vec3(0.1, 1.0, 0.0);
	materials[3].LightCoeffs = vec4(lightCoefs);
	materials[3].ReflectionCoef = 0.5;
	materials[3].RefractionCoef = 1.0;
	materials[3].IOR = 1.0;
	materials[3].MaterialType = DIFFUSE;
	
	/* BLUE */
	materials[4].Color = vec3(0.1, 0.2, 0.4);
	materials[4].LightCoeffs = vec4(lightCoefs);
	materials[4].ReflectionCoef = 0.5;
	materials[4].RefractionCoef = 1.0;
	materials[4].IOR = 1.0;
	materials[4].MaterialType = DIFFUSE;
	
	/* RED */
	materials[5].Color = vec3(1.0, 0.0, 0.0);
	materials[5].LightCoeffs = vec4(lightCoefs);
	materials[5].ReflectionCoef = 0.5;
	materials[5].RefractionCoef = 1.0;
	materials[5].IOR = 1.0;
	materials[5].MaterialType = DIFFUSE;
}

bool IntersectSphere (  SSphere sphere, SRay ray, float start, float final, out float time)
{
	vec3 originLocal = ray.Origin - sphere.Center;
    float A = dot(ray.Direction, ray.Direction);
    float B = dot(ray.Direction, originLocal);
    float C = dot(originLocal, originLocal) - sphere.Radius * sphere.Radius;
    float D = B * B - A * C;
    if (D >= 0.0)
    {
        D = sqrt(D);
        float t1 = (-B - D) / A;
        float t2 = (-B + D) / A;

        if(t1 < 0 && t2 < 0)
		{
			return false;
		}
		if(min(t1, t2) < 0)
		{
			time = max(t1, t2);
			return true;
		}
		time = min(t1, t2);
		return true;
    }
    return false;
}

bool IntersectTriangle (SRay ray, vec3 v1, vec3 v2, vec3 v3, float start, float final, out float time )
{   
	time = -1;

	vec3 A = v2 - v1;
	vec3 B = v3 - v1;
	vec3 N = cross(A, B);
	
	float NdotRayDirection = dot(N, ray.Direction);
	
	if (abs(NdotRayDirection) < 0.001)
		return false;
	float d = dot(N, v1);
	float t = -(dot(N, ray.Origin) - d) / NdotRayDirection;
    if (t < start || t > final || t < 0)
        return false;

	vec3 P = ray.Origin + t * ray.Direction;
	vec3 C;
	
	vec3 edge1 = v2 - v1;
	vec3 VP1 = P - v1;
	C = cross(edge1, VP1);
	if (dot(N, C) < 0)
		return false;
	
	vec3 edge2 = v3 - v2;
	vec3 VP2 = P - v2;
	C = cross(edge2, VP2);
	if (dot(N, C) < 0)
		return false;
	
	vec3 edge3 = v1 - v3;
	vec3 VP3 = P - v3;
	C = cross(edge3, VP3);
	if (dot(N, C) < 0)
		return false;
	time = t;
	return true;
}

bool Raytrace ( SRay ray,
				float start, float final,
				inout SIntersection intersect)
{
	bool result = false;
	float test = start;
	intersect.Time = BIG;
	for(int i = 0; i < 0; i++)
	{
		SSphere sphere = spheres[i];
		if( IntersectSphere (sphere, ray, start, final, test ))
		{
			if (test >= start && test <= final && test >= 0.0 && test < intersect.Time)
			{
				intersect.Time = test;
				intersect.Point = ray.Origin + ray.Direction * test;
				intersect.Normal = normalize ( intersect.Point - spheres[i].Center );
				intersect.MaterialIdx = sphere.MaterialIdx;
				result = true;
			}
		}
	}
	for(int i = 0; i < 12; i++)
	{
		STriangle triangle = triangles[i];
		if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, start, final, test))
		{
			if (test >= start && test <= final && test >= 0.0 && test < intersect.Time)
			{
				intersect.Time			 = test;
				intersect.Point			 = ray.Origin + ray.Direction * test;
				intersect.Normal		 = normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
				intersect.MaterialIdx    = triangle.MaterialIdx; 
				result = true;
			}
		}
	}
	return result;
}

float Shadow(SLight currLight, SIntersection intersect)
{
	float shadowing = 1.0;
	vec3 direction = normalize(currLight.Position - intersect.Point);
	float distanceLight = distance(currLight.Position, intersect.Point);
	
	SRay shadowRay = SRay( intersect.Point + vec3(EPSILON * direction), direction);
	
	SIntersection shadowIntersect;
	shadowIntersect.Time = BIG;
	if(Raytrace(shadowRay, 0, distanceLight, shadowIntersect))
	{
		shadowing = 0.0;
	}
	return shadowing;
}

vec3 Phong ( SIntersection intersect, SLight currLight, float shadow)
{
	vec3 light = normalize ( currLight.Position - intersect.Point );
	float diffuse = max(dot(light, intersect.Normal), 0.0);
	vec3 view = normalize(uCamera.Position - intersect.Point);
	vec3 reflected = reflect( -view, intersect.Normal );
	float specular = pow(max(dot(reflected, light), 0.0), materials[intersect.MaterialIdx].LightCoeffs.w);
	return materials[intersect.MaterialIdx].LightCoeffs.x * materials[intersect.MaterialIdx].Color +
		   materials[intersect.MaterialIdx].LightCoeffs.y * diffuse * materials[intersect.MaterialIdx].Color * shadow +
		   materials[intersect.MaterialIdx].LightCoeffs.z * specular * Unit;
}

SRay GenerateRay ( SCamera uCamera )
{
	vec2 coords = glPosition.xy * uCamera.Scale;
	vec3 direction = uCamera.View + uCamera.Side * coords.x + uCamera.Up * coords.y;
	return SRay ( uCamera.Position, normalize(direction) );
}

void main ( void )
{
    float start = 0;
    float final = BIG;

    initializeDefaultScene ();
    initializeDefaultLightMaterials();

    SRay ray = GenerateRay( uCamera );
    vec3 resultColor = vec3(0.0,0.0,0.0);

    SIntersection intersect;
    intersect.Time = BIG;

    STracingRay trRay = STracingRay(ray, 1.0, 0, 1.0);
    initStack();
	push(trRay);

    while(!isEmpty())
    {
        STracingRay currentTrRay = pop();
        SRay currentRay = currentTrRay.ray;
		
		float currentContribution = currentTrRay.contribution;
        int currentDepth = currentTrRay.depth;
        float currentIOR = currentTrRay.currentIOR; // Показатель преломления текущей среды

		start = 0;
        final = BIG;

        if ( currentContribution < EPSILON || currentDepth > RayTracingDepth )
        {
            break;
        }

        if (Raytrace(currentRay, start, final, intersect))
        {
            SMaterial intersectedMaterial = materials[intersect.MaterialIdx];
            switch(intersectedMaterial.MaterialType)
            {
				case DIFFUSE_REFLECTION:
                {
                    float shadow = Shadow(uLight, intersect);
                    resultColor += currentContribution * Phong(intersect, uLight, shadow);
                    break;
                }
                case MIRROR_REFLECTION:
                {
                    if(intersectedMaterial.ReflectionCoef < 1.0) // если отражение не 100%, то будет затенение на объекте и собственный цвет
                    {
                        float directContribution = currentContribution * (1.0 - intersectedMaterial.ReflectionCoef);
                        float shadow = Shadow(uLight, intersect);
                        resultColor += directContribution * Phong(intersect, uLight, shadow);
                    }
					vec3 reflectDirection = reflect(currentRay.Direction, intersect.Normal);
                    float reflectContribution = currentContribution * intersectedMaterial.ReflectionCoef;
					if (reflectContribution > EPSILON)
                    {
                        STracingRay reflectRay = STracingRay(SRay(intersect.Point + reflectDirection * EPSILON, reflectDirection), 
																reflectContribution, currentDepth + 1, currentIOR);
                        push(reflectRay);
                    }
                    break;
                }
				case REFRACT_REFLECTION:
				{
					if(intersectedMaterial.ReflectionCoef < 1.0) // если отражение не 100%, то будет затенение на объекте и собственный цвет
                    {
                        float directContribution = currentContribution * (1.0 - intersectedMaterial.ReflectionCoef);
                        float shadow = Shadow(uLight, intersect);
                        resultColor += directContribution * Phong(intersect, uLight, shadow);
                    }
					vec3 reflectDirection = reflect(currentRay.Direction, intersect.Normal);
                    float reflectContribution = currentContribution * intersectedMaterial.ReflectionCoef;
					if (reflectContribution > EPSILON)
                    {
                        STracingRay reflectRay = STracingRay(SRay(intersect.Point + reflectDirection * EPSILON, reflectDirection), 
																reflectContribution, currentDepth + 1, currentIOR);
                        push(reflectRay);
                    }
                    break;
				}
            }
        }
    }
    FragColor = vec4 (resultColor, 1.0);
}
