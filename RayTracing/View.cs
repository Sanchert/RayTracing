using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.ComTypes;
using System.Text;
using System.Threading.Tasks;

using OpenTK;
using OpenTK.Graphics.OpenGL;

namespace RayTracing
{
    public static class View
    {   
        public static int BasicVertexShader;
        public static int BasicFragmentShader;
        public static int BasicProgramID;

        public static void SetupView(int width, int height)
        {
            GL.ShadeModel(ShadingModel.Smooth);
            GL.MatrixMode(MatrixMode.Projection);
            GL.LoadIdentity();
            GL.Ortho(0, 1, 0, 1, -1, 1);
            GL.Viewport(0, 0, width, height);
        }

        private static void loadShader(String filename, ShaderType type, int program, out int address)
        {
            address = GL.CreateShader(type);
            using (System.IO.StreamReader sr = new StreamReader(filename))
            {
                GL.ShaderSource(address, sr.ReadToEnd());
            }
            GL.CompileShader(address);
            GL.AttachShader(program, address);
            Console.WriteLine("--->" + GL.GetShaderInfoLog(address));
        }

        public static void InitShaders()
        {
            BasicProgramID = GL.CreateProgram();

            loadShader("..\\..\\raytracing.vert", ShaderType.VertexShader, BasicProgramID, out BasicVertexShader);
            loadShader("..\\..\\raytracing.frag", ShaderType.FragmentShader, BasicProgramID, out BasicFragmentShader);
            
            Console.WriteLine("---||---" + BasicProgramID);
            Console.WriteLine("---||---" + BasicVertexShader);
            Console.WriteLine("---||---" + BasicFragmentShader);

            GL.LinkProgram(BasicProgramID);

            // Проверяем успех компоновки
            int status = 0;
            GL.GetProgram(BasicProgramID, GetProgramParameterName.LinkStatus, out status);
            Console.WriteLine(GL.GetProgramInfoLog(BasicProgramID));
        }
    }
}
