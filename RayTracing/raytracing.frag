#version 430
 
 #define EPSILON 0.01f
 #define BIG 100000.0
 #define MAX_SIZE 64 
 #define MAX_DEPTH 63

 out vec4 FragColor;
 in vec3 glPosition;
 
 const int DIFFUSE = 1;
 const int REFLECTION = 2;
 const int REFRACTION = 3;
 
 const int DIFFUSE_REFLECTION = 1;
 const int MIRROR_REFLECTION = 2;

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
 	vec3 Color; //diffuse color
 	vec4 LightCoeffs; // ambient, diffuse and specular coeffs
 	float ReflectionCoef;
 	float RefractionCoef;
 	int MaterialType; // 0 - non-reflection, 1 - mirror
 };
 
 struct SIntersection
 {
 	float Time;
 	vec3 Point;
 	vec3 Normal;
 	vec3 Color;
 	vec4 LightCoeffs;
 	float ReflectionCoef;
 	float RefractionCoef;
 	int MaterialType;
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
 SLight uLight;
 STriangle triangles[12];
 SSphere spheres[2];
 SMaterial materials[6];
 float Unit = 1.0;
 
 // Structure to represent the stack
 struct Stack {
     STracingRay items[MAX_SIZE];
     int top;
 };
 Stack myStack;
 void initStack(inout Stack stack) {
     stack.top = -1;
 }
 
 bool isFull(Stack stack) {
     return stack.top == MAX_SIZE - 1;
 }
 
 bool isEmpty(Stack stack) {
     return stack.top == -1;
 }
 
 bool push(inout Stack stack, STracingRay item) {
     if (!isFull(stack))
 	{
 		stack.items[++stack.top] = item;
 		return true;
 	}
 	return false;
 }
 
 STracingRay pop(inout Stack stack) {
     if (!isEmpty(stack)) 
 	{
 		return stack.items[stack.top--];
 	}
 }
 
 void initializeDefaultScene()
 {
 	/** TRIANGLES **/
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
 
 	/** SPHERES **/
 	spheres[1].Center = vec3(-1.0,-1.0,-2.0);
 	spheres[1].Radius = 2.0;
 	spheres[1].MaterialIdx = 2;
 	
 	spheres[0].Center = vec3(3.5, 1.0, 2.0);
 	spheres[0].Radius = 1.0;
 	spheres[0].MaterialIdx = 2;
 }
 
 void initializeDefaultLightMaterials()
 {
 	
 	uLight.Position = vec3(0.0, 2.0, -8.0);
 	
 	vec4 lightCoefs = vec4(0.4,0.9,0.0,512.0);
 
 	/* WHITE - DIFFUSE	*/
 	materials[0].Color = vec3(1.0, 1.0, 1.0);
 	materials[0].LightCoeffs = vec4(lightCoefs);
 	materials[0].ReflectionCoef = 0.5;
 	materials[0].RefractionCoef = 1.0;
 	materials[0].MaterialType = DIFFUSE;
 	
 	/* PURPLE */
 	materials[1].Color = vec3(1.0, 0.0, 1.0);
 	materials[1].LightCoeffs = vec4(lightCoefs);
 	materials[1].ReflectionCoef = 0.5;
 	materials[1].RefractionCoef = 1.0;
 	materials[1].MaterialType = DIFFUSE;
 	
 	/* WHITE REFLECTION */
 	materials[2].Color = vec3(1.0, 1.0, 1.0);
 	materials[2].LightCoeffs = vec4(lightCoefs);
 	materials[2].ReflectionCoef = 0.875;
 	materials[2].RefractionCoef = 1.0;
 	materials[2].MaterialType = REFLECTION;
 	
 	/* GREEN */
 	materials[3].Color = vec3(0.1, 1.0, 0.0);
 	materials[3].LightCoeffs = vec4(lightCoefs);
 	materials[3].ReflectionCoef = 0.5;
 	materials[3].RefractionCoef = 1.0;
 	materials[3].MaterialType = DIFFUSE;
 	
 	/* BLUE */
 	materials[4].Color = vec3(0.0, 0.2, 1.0);
 	materials[4].LightCoeffs = vec4(lightCoefs);
 	materials[4].ReflectionCoef = 0.5;
 	materials[4].RefractionCoef = 1.0;
 	materials[4].MaterialType = DIFFUSE;
 	
 	/* RED */
 	materials[5].Color = vec3(1.0, 0.0, 0.0);
 	materials[5].LightCoeffs = vec4(lightCoefs);
 	materials[5].ReflectionCoef = 0.5;
 	materials[5].RefractionCoef = 1.0;
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
 
         if (t1 >= start && t1 <= final && (t1 >= 0))
         {
             time = t1;
             return true;
         }
         if (t2 >= start && t2 <= final && (t2 >= 0))
         {
             time = t2;
             return true;
         }
         return false;
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
 	for(int i = 0; i < 2; i++)
 	{
 		SSphere sphere = spheres[i];
 		if( IntersectSphere (sphere, ray, start, final, test ))
 		{
 			if (test >= start && test <= final && test >= 0.0 && test < intersect.Time)
 			{
 				intersect.Time = test;
 				intersect.Point = ray.Origin + ray.Direction * test;
 				intersect.Normal = normalize ( intersect.Point - spheres[i].Center );
 				intersect.Color = materials[sphere.MaterialIdx].Color;
 				intersect.LightCoeffs = materials[sphere.MaterialIdx].LightCoeffs;
 				intersect.ReflectionCoef = materials[sphere.MaterialIdx].ReflectionCoef;
 				intersect.RefractionCoef = materials[sphere.MaterialIdx].RefractionCoef;
 				intersect.MaterialType = materials[sphere.MaterialIdx].MaterialType;
 			
 				result = true;
 			}
 		}
 	}
 	for(int i = 0; i < 10; i++)
 	{
 		STriangle triangle = triangles[i];
 		if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, start, final, test))
 		{
 			if (test >= start && test <= final && test >= 0.0 && test < intersect.Time)
 			{
 				intersect.Time			 = test;
 				intersect.Point			 = ray.Origin + ray.Direction * test;
 				intersect.Normal		 = normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
 				intersect.Color			 = materials[triangle.MaterialIdx].Color;
 				intersect.LightCoeffs	 = materials[triangle.MaterialIdx].LightCoeffs;
 				intersect.ReflectionCoef = materials[triangle.MaterialIdx].ReflectionCoef;
 				intersect.RefractionCoef = materials[triangle.MaterialIdx].RefractionCoef;
 				intersect.MaterialType	 = materials[triangle.MaterialIdx].MaterialType;
 			
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
 	
 	SRay shadowRay;
 	shadowRay.Origin = intersect.Point + vec3(EPSILON * direction);
 	shadowRay.Direction = direction;
 	
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
 	float specular = pow(max(dot(reflected, light), 0.0), intersect.LightCoeffs.w);
 	return intersect.LightCoeffs.x * intersect.Color +
 		   intersect.LightCoeffs.y * diffuse * intersect.Color * shadow +
 		   intersect.LightCoeffs.z * specular * Unit;
 }
 
 SRay GenerateRay ( SCamera uCamera )
 {
 	vec2 coords = glPosition.xy * uCamera.Scale;
 	vec3 direction = uCamera.View + uCamera.Side * coords.x + uCamera.Up * coords.y;
 	return SRay ( uCamera.Position, normalize(direction) );
 }
 
 void main ( void )
 {
 	float start = EPSILON;
 	float final = BIG;

 	initializeDefaultScene();
 	initializeDefaultLightMaterials();
 	
 	SRay ray = GenerateRay( uCamera );
 	vec3 resultColor = vec3(0.0,0.0,0.0);
 	
 	SIntersection intersect;
 	intersect.Time = BIG;
 	
 	initStack(myStack);
 
 	STracingRay trRay = STracingRay(ray, 1, 0);
 	push(myStack, trRay);
 	while(!isEmpty(myStack))
 	{
 		STracingRay trRay = pop(myStack);
        ray = trRay.ray;
 		
 		final = BIG;
 		if (Raytrace(ray, start, final, intersect))
 		{
 			
 			switch(intersect.MaterialType)
 			{
 				case DIFFUSE_REFLECTION:
 				{
 					float shadow = Shadow(uLight, intersect);
 					resultColor += trRay.contribution * Phong(intersect, uLight, shadow);
 					break;
 				}
 				case MIRROR_REFLECTION:
 				{
 					if(intersect.ReflectionCoef < 1)
 					{
 						float contribution = trRay.contribution * (1 - intersect.ReflectionCoef);
 						float shadow = Shadow(uLight, intersect);
 						resultColor += contribution * Phong(intersect, uLight, shadow);
 					}
 					vec3 reflectDirection = reflect(ray.Direction, intersect.Normal);
 					
 					float contribution = trRay.contribution * intersect.ReflectionCoef;
 					if (trRay.depth < MAX_DEPTH) {
        
                        STracingRay reflectRay = STracingRay(SRay(intersect.Point + reflectDirection * EPSILON, reflectDirection), contribution, trRay.depth + 1);
 					    push(myStack, reflectRay);
                    }
                    break;
 				}
 			}
 		}
 	}
 	FragColor = vec4 (resultColor, 1.0);
 }